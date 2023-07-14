/*
Copyright 2022 The Kubermatic Kubernetes Platform contributors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package websocket

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/websocket"

	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/log"
	"k8c.io/kubermatic/v2/pkg/resources"

	batchv1 "k8s.io/api/batch/v1"
	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/apimachinery/pkg/util/wait"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/remotecommand"
	"k8s.io/kubectl/pkg/scheme"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	END_OF_TRANSMISSION               = "\u0004"
	timeout                           = 2 * time.Minute
	appName                           = "webterminal"
	webTerminalStorage                = "web-terminal-storage"
	webTerminalConfigVolume           = "web-terminal-config"
	podLifetime                       = 30 * time.Minute
	maxNumberOfExpirationRefreshes    = 48              // it means maximum 24h for a pod lifetime of 30 minutes
	remainingExpirationTimeForWarning = 5 * time.Minute // should be lesser than "podLifetime"
	expirationCheckInterval           = 1 * time.Minute // should be lesser than "remainingExpirationTimeForWarning"
	expirationTimestampKey            = "ExpirationTimestamp"
	expirationRefreshesKey            = "ExpirationRefreshes"
	pingInterval                      = 30 * time.Second
	pingMessage                       = "PING"
	pongMessage                       = "PONG"

	webTerminalImage                   = resources.RegistryQuay + "/kubermatic/web-terminal:0.6.0"
	webTerminalContainerKubeconfigPath = "/etc/kubernetes/kubeconfig/kubeconfig"
)

type TerminalConnStatus string

const (
	KubeconfigSecretMissing TerminalConnStatus = "KUBECONFIG_SECRET_MISSING"
	WebterminalPodPending   TerminalConnStatus = "WEBTERMINAL_POD_PENDING"
	WebterminalPodFailed    TerminalConnStatus = "WEBTERMINAL_POD_FAILED"
	ConnectionPoolExceeded  TerminalConnStatus = "CONNECTION_POOL_EXCEEDED"
	RefreshesLimitExceeded  TerminalConnStatus = "REFRESHES_LIMIT_EXCEEDED"
)

// PtyHandler is what remote command expects from a pty.
type PtyHandler interface {
	io.Reader
	io.Writer
	remotecommand.TerminalSizeQueue
}

// TerminalSession implements PtyHandler (using a websocket connection).
type TerminalSession struct {
	websocketConn *websocket.Conn
	sizeChan      chan remotecommand.TerminalSize
	doneChan      chan struct{}

	userEmailID   string
	clusterClient ctrlruntimeclient.Client
}

// TerminalMessage is the messaging protocol between ShellController and TerminalSession.
//
// OP          DIRECTION  FIELD(S) USED  DESCRIPTION
// ---------------------------------------------------------------------
// stdin       fe->be     Data           Keystrokes/paste buffer.
// resize      fe->be     Rows, Cols     New terminal size.
// refresh     fe->be                    Signal to extend expiration time.
// msg         fe->be     Data           Any other necessary message from the frontend to the backend.
// stdout      be->fe     Data           Output from the process.
// toast       be->fe     Data           OOB message to be shown to the user.
// msg         be->fe     Data           Any necessary message from the backend to the frontend.
// expiration  be->fe     Data           Expiration timestamp in seconds.
type TerminalMessage struct {
	Op, Data   string
	Rows, Cols uint16
}

// TerminalSize handles pty->process resize events.
// Called in a loop from remotecommand as long as the process is running.
func (t TerminalSession) Next() *remotecommand.TerminalSize {
	select {
	case size := <-t.sizeChan:
		return &size
	case <-t.doneChan:
		return nil
	}
}

// Read handles pty->process messages (stdin, resize, refresh, msg).
// Called in a loop from remotecommand as long as the process is running.
func (t TerminalSession) Read(p []byte) (int, error) {
	_, m, err := t.websocketConn.ReadMessage()
	if err != nil {
		// Send terminated signal to process to avoid resource leak
		return copy(p, END_OF_TRANSMISSION), err
	}

	var msg TerminalMessage
	if err := json.Unmarshal(m, &msg); err != nil {
		return copy(p, END_OF_TRANSMISSION), err
	}

	switch msg.Op {
	case "stdin":
		return copy(p, msg.Data), nil
	case "resize":
		t.sizeChan <- remotecommand.TerminalSize{Width: msg.Cols, Height: msg.Rows}
		return 0, nil
	case "refresh":
		return 0, t.extendExpirationTime(context.Background())
	case "msg":
		switch msg.Data {
		case pongMessage:
			// just ignore "pong" messages
			return 0, nil
		default:
			return 0, fmt.Errorf("unexpected message '%s'", msg.Data)
		}
	default:
		return copy(p, END_OF_TRANSMISSION), fmt.Errorf("unknown message type '%s'", msg.Op)
	}
}

// Write handles process->pty stdout.
// Called from remotecommand whenever there is any output.
func (t TerminalSession) Write(p []byte) (int, error) {
	msg, err := json.Marshal(TerminalMessage{
		Op:   "stdout",
		Data: string(p),
	})
	if err != nil {
		return 0, err
	}

	if err = t.websocketConn.WriteMessage(websocket.TextMessage, msg); err != nil {
		return 0, err
	}

	return len(p), nil
}

// Toast can be used to send the user any OOB messages.
// hterm puts these in the center of the terminal.
func (t TerminalSession) Toast(p string) error {
	msg, err := json.Marshal(TerminalMessage{
		Op:   "toast",
		Data: p,
	})
	if err != nil {
		return err
	}

	if err = t.websocketConn.WriteMessage(websocket.TextMessage, msg); err != nil {
		return err
	}
	return nil
}

func (t TerminalSession) extendExpirationTime(ctx context.Context) error {
	_, currentNumberOfRefreshes, err := getWebTerminalExpirationValues(ctx, t.clusterClient, t.userEmailID)
	if err != nil {
		return err
	}

	if currentNumberOfRefreshes >= maxNumberOfExpirationRefreshes {
		_ = SendMessage(t.websocketConn, string(RefreshesLimitExceeded))
		return nil
	}

	// regenerate the configmap to extend the expiration period
	if err := t.clusterClient.Update(ctx,
		genWebTerminalConfigMap(
			userAppName(t.userEmailID),
			currentNumberOfRefreshes+1,
		)); err != nil {
		return err
	}

	return nil
}

func userAppName(userEmailID string) string {
	return fmt.Sprintf("%s-%s", appName, userEmailID)
}

func getWebTerminalExpirationValues(ctx context.Context, clusterClient ctrlruntimeclient.Client, userEmailID string) (time.Time, int, error) {
	webTerminalConfigMap := &corev1.ConfigMap{}
	if err := clusterClient.Get(ctx, ctrlruntimeclient.ObjectKey{
		Namespace: metav1.NamespaceSystem,
		Name:      userAppName(userEmailID),
	}, webTerminalConfigMap); err != nil {
		return time.Time{}, 0, err
	}

	if webTerminalConfigMap.Data == nil {
		return time.Time{}, 0, errors.New("no data set for webterminal configmap")
	}

	expirationTimestampStr, isExpirationSet := webTerminalConfigMap.Data[expirationTimestampKey]
	if !isExpirationSet {
		return time.Time{}, 0, errors.New("no expiration set in the webterminal configmap")
	}
	expirationTimestamp, err := strconv.ParseInt(expirationTimestampStr, 10, 64)
	if err != nil {
		return time.Time{}, 0, errors.New("invalid expiration timestamp in the webterminal configmap")
	}
	expirationTime := time.Unix(expirationTimestamp, 0)

	expirationRefreshesStr, isExpirationRefreshesSet := webTerminalConfigMap.Data[expirationRefreshesKey]
	if !isExpirationRefreshesSet {
		return time.Time{}, 0, errors.New("no number of expiration refreshes set in the webterminal configmap")
	}
	expirationRefreshes, err := strconv.Atoi(expirationRefreshesStr)
	if err != nil {
		return time.Time{}, 0, errors.New("invalid number of expiration refreshes in the webterminal configmap")
	}

	return expirationTime, expirationRefreshes, nil
}

func pingRoutine(websocketConn *websocket.Conn) {
	for {
		time.Sleep(pingInterval)
		// Message to check if connection with client is active.
		if err := SendMessage(websocketConn, pingMessage); err != nil {
			// connection is already closed, so just return
			return
		}
	}
}

func expirationCheckRoutine(ctx context.Context, clusterClient ctrlruntimeclient.Client, userEmailID string, websocketConn *websocket.Conn) {
	for {
		time.Sleep(expirationCheckInterval)

		expirationTime, numberOfRefreshes, err := getWebTerminalExpirationValues(ctx, clusterClient, userEmailID)
		if err != nil {
			log.Logger.Debug(err)
			break
		}

		remainingExpirationTime := time.Until(expirationTime)

		if remainingExpirationTime <= 0 || numberOfRefreshes > maxNumberOfExpirationRefreshes {
			// web terminal is already expired, so break the check loop
			break
		}

		if remainingExpirationTime < remainingExpirationTimeForWarning {
			_ = websocketConn.WriteJSON(TerminalMessage{
				Op:   "expiration",
				Data: expirationTime.UTC().Format(time.RFC3339),
			})
		}
	}
}

// startProcess is called by terminal session creation.
// Executed cmd in the container specified in request and connects it up with the ptyHandler (a session).
func startProcess(ctx context.Context, client ctrlruntimeclient.Client, k8sClient kubernetes.Interface, cfg *rest.Config, userEmailID string, cluster *kubermaticv1.Cluster, cmd []string, ptyHandler PtyHandler, websocketConn *websocket.Conn) error {
	userAppName := userAppName(userEmailID)

	// check if WEB terminal Pod exists, if not create
	pod := &corev1.Pod{}
	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{
		Namespace: metav1.NamespaceSystem,
		Name:      userAppName,
	}, pod); err != nil {
		if !apierrors.IsNotFound(err) {
			return err
		}
		// create NetworkPolicy, Pod and cleanup Job
		if err := createOrUpdateResources(ctx, client, userEmailID, userAppName, cluster); err != nil {
			return err
		}
	}

	// create or update ConfigMap to renew expiration time
	if err := client.Create(ctx, genWebTerminalConfigMap(userAppName, 0)); err != nil {
		if !apierrors.IsAlreadyExists(err) {
			return err
		}
		err := client.Update(ctx, genWebTerminalConfigMap(userAppName, 0))
		if err != nil {
			return err
		}
	}

	if !WaitFor(ctx, 5*time.Second, timeout, func(ctx context.Context) bool {
		pod := &corev1.Pod{}
		if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{
			Namespace: metav1.NamespaceSystem,
			Name:      userAppName,
		}, pod); err != nil {
			return false
		}

		var status string

		switch pod.Status.Phase {
		case corev1.PodRunning:
			return true
		case corev1.PodPending:
			status = string(WebterminalPodPending)
		case corev1.PodFailed:
			status = string(WebterminalPodFailed)
		default:
			status = fmt.Sprintf("pod in %s phase", pod.Status.Phase)
		}
		_ = SendMessage(websocketConn, status)
		return false
	}) {
		return fmt.Errorf("the WEB terminal Pod is not ready")
	}

	go pingRoutine(websocketConn)

	go expirationCheckRoutine(ctx, client, userEmailID, websocketConn)

	req := k8sClient.CoreV1().RESTClient().Post().
		Resource("pods").
		Name(userAppName).
		Namespace(metav1.NamespaceSystem).
		SubResource("exec")

	req.VersionedParams(&corev1.PodExecOptions{
		Command: cmd,
		Stdin:   true,
		Stdout:  true,
		Stderr:  true,
		TTY:     true,
	}, scheme.ParameterCodec)

	exec, err := remotecommand.NewSPDYExecutor(cfg, http.MethodPost, req.URL())
	if err != nil {
		return err
	}

	err = exec.StreamWithContext(ctx, remotecommand.StreamOptions{
		Stdin:             ptyHandler,
		Stdout:            ptyHandler,
		Stderr:            ptyHandler,
		TerminalSizeQueue: ptyHandler,
		Tty:               true,
	})
	if err != nil {
		return err
	}

	return nil
}

func createOrUpdateResources(ctx context.Context, client ctrlruntimeclient.Client, userEmailID, userAppName string, cluster *kubermaticv1.Cluster) error {
	webTerminalNetworkPolicy, err := genWebTerminalNetworkPolicy(userAppName, cluster)
	if err != nil {
		return err
	}
	if err := client.Create(ctx, webTerminalNetworkPolicy); err != nil {
		if !apierrors.IsAlreadyExists(err) {
			return err
		}
		err := client.Update(ctx, webTerminalNetworkPolicy)
		if err != nil {
			return err
		}
	}
	if err := client.Create(ctx, genWebTerminalPod(userAppName, userEmailID)); err != nil {
		if !apierrors.IsAlreadyExists(err) {
			return err
		}
	}
	if err := client.Create(ctx, genWebTerminalCleanupJob(userAppName, userEmailID)); err != nil {
		if !apierrors.IsAlreadyExists(err) {
			return err
		}
	}

	return nil
}

func genWebTerminalConfigMap(userAppName string, numberOfExpirationRefreshes int) *corev1.ConfigMap {
	expirationTime := time.Now().Add(podLifetime)

	return &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{
			Name:      userAppName,
			Namespace: metav1.NamespaceSystem,
			Labels: map[string]string{
				resources.AppLabelKey: appName,
			},
		},
		Data: map[string]string{
			expirationTimestampKey: strconv.FormatInt(expirationTime.Unix(), 10),
			expirationRefreshesKey: strconv.Itoa(numberOfExpirationRefreshes),
		},
	}
}

func genWebTerminalNetworkPolicy(userAppName string, cluster *kubermaticv1.Cluster) (*networkingv1.NetworkPolicy, error) {
	dnsPort := intstr.FromInt(53)
	apiServicePort := intstr.FromInt(443)
	protoUdp := corev1.ProtocolUDP
	protoTcp := corev1.ProtocolTCP
	k8sApiIP := cluster.Status.Address.IP
	apiPort := intstr.FromInt(int(cluster.Status.Address.Port))

	k8sServiceApiIP, err := resources.InClusterApiserverIP(cluster)
	if err != nil {
		return nil, err
	}

	// block all ingress and allow only egress to the API server
	return &networkingv1.NetworkPolicy{
		ObjectMeta: metav1.ObjectMeta{
			Name:      userAppName,
			Namespace: metav1.NamespaceSystem,
		},
		Spec: networkingv1.NetworkPolicySpec{
			PodSelector: metav1.LabelSelector{
				MatchLabels: map[string]string{
					resources.AppLabelKey: appName,
				},
			},
			PolicyTypes: []networkingv1.PolicyType{
				networkingv1.PolicyTypeIngress,
				networkingv1.PolicyTypeEgress,
			},
			// api access
			Egress: []networkingv1.NetworkPolicyEgressRule{
				{
					To: []networkingv1.NetworkPolicyPeer{
						{
							IPBlock: &networkingv1.IPBlock{
								CIDR: fmt.Sprintf("%s/32", k8sApiIP),
							},
						},
					},
					Ports: []networkingv1.NetworkPolicyPort{
						{
							Protocol: &protoTcp,
							Port:     &apiPort,
						},
					},
				},
				{
					To: []networkingv1.NetworkPolicyPeer{
						{
							IPBlock: &networkingv1.IPBlock{
								CIDR: fmt.Sprintf("%s/32", k8sServiceApiIP),
							},
						},
					},
					Ports: []networkingv1.NetworkPolicyPort{
						{
							Protocol: &protoTcp,
							Port:     &apiServicePort,
						},
					},
				},
				// world dns access
				{
					To: []networkingv1.NetworkPolicyPeer{
						{
							IPBlock: &networkingv1.IPBlock{
								CIDR: "0.0.0.0/0",
							},
						},
					},
					Ports: []networkingv1.NetworkPolicyPort{
						{
							Protocol: &protoTcp,
							Port:     &dnsPort,
						},
						{
							Protocol: &protoUdp,
							Port:     &dnsPort,
						},
					},
				},
			},
		},
	}, nil
}

func genWebTerminalPod(userAppName, userEmailID string) *corev1.Pod {
	pod := &corev1.Pod{}
	pod.Name = userAppName
	pod.Namespace = metav1.NamespaceSystem
	pod.Labels = map[string]string{
		resources.AppLabelKey: appName,
	}
	pod.Spec = corev1.PodSpec{}
	pod.Spec.Volumes = getVolumes(userEmailID, userAppName)
	pod.Spec.InitContainers = []corev1.Container{}
	pod.Spec.Containers = []corev1.Container{
		{
			Name:    userAppName,
			Image:   webTerminalImage,
			Command: []string{"/bin/bash", "-c", "--"},
			Args:    []string{"while true; do sleep 30; done;"},
			Env: []corev1.EnvVar{
				{
					Name:  "KUBECONFIG",
					Value: webTerminalContainerKubeconfigPath,
				},
				{
					Name:  "PS1",
					Value: "\\$ ",
				},
			},
			VolumeMounts: getVolumeMounts(),
			SecurityContext: &corev1.SecurityContext{
				AllowPrivilegeEscalation: resources.Bool(false),
			},
		},
	}

	pod.Spec.SecurityContext = &corev1.PodSecurityContext{
		RunAsUser:  resources.Int64(1000),
		RunAsGroup: resources.Int64(3000),
		FSGroup:    resources.Int64(2000),
		SeccompProfile: &corev1.SeccompProfile{
			Type: corev1.SeccompProfileTypeRuntimeDefault,
		},
	}

	return pod
}

func genWebTerminalCleanupJob(userAppName, userEmailID string) *batchv1.Job {
	return &batchv1.Job{
		ObjectMeta: metav1.ObjectMeta{
			Name:      fmt.Sprintf("cleanup-%s", userAppName),
			Namespace: metav1.NamespaceSystem,
			Labels: map[string]string{
				resources.AppLabelKey: appName,
			},
		},
		Spec: batchv1.JobSpec{
			BackoffLimit:            resources.Int32(10 + maxNumberOfExpirationRefreshes),
			Completions:             resources.Int32(1),
			Parallelism:             resources.Int32(1),
			TTLSecondsAfterFinished: resources.Int32(0),
			Template: corev1.PodTemplateSpec{
				Spec: corev1.PodSpec{
					Volumes:        getVolumes(userEmailID, userAppName),
					InitContainers: []corev1.Container{},
					Containers: []corev1.Container{
						{
							Name:    userAppName,
							Image:   webTerminalImage,
							Command: []string{"/bin/bash", "-c"},
							Args: []string{`
								EXP=$(<$EXPIRATION);
								NOW=$(date +"%s");
								REMAINING_TIME_SEC=$((EXP-NOW));
								EXP_REFRESHES=$(<$EXPIRATION_REFRESHES);
								if (( EXP_REFRESHES <= MAX_EXPIRATION_REFRESHES && REMAINING_TIME_SEC > 0 )); then
									sleep $REMAINING_TIME_SEC;
									exit 1; # exit as failed, so the job will be restarted to check if the expiration was updated
								fi
								# user web terminal is already expired, so delete its resources
								kubectl delete networkpolicy $USER_APP_NAME -n $NAMESPACE_SYSTEM;
								kubectl delete configmap $USER_APP_NAME -n $NAMESPACE_SYSTEM;
								kubectl delete pod $USER_APP_NAME -n $NAMESPACE_SYSTEM;`,
							},
							Env: []corev1.EnvVar{
								{
									Name:  "KUBECONFIG",
									Value: webTerminalContainerKubeconfigPath,
								},
								{
									Name:  "USER_APP_NAME",
									Value: userAppName,
								},
								{
									Name:  "NAMESPACE_SYSTEM",
									Value: metav1.NamespaceSystem,
								},
								{
									Name:  "EXPIRATION",
									Value: "/etc/config/expiration",
								},
								{
									Name:  "EXPIRATION_REFRESHES",
									Value: "/etc/config/expiration-refreshes",
								},
								{
									Name:  "MAX_EXPIRATION_REFRESHES",
									Value: strconv.Itoa(maxNumberOfExpirationRefreshes),
								},
								{
									Name:  "PS1",
									Value: "\\$ ",
								},
							},
							VolumeMounts: getVolumeMounts(),
							SecurityContext: &corev1.SecurityContext{
								AllowPrivilegeEscalation: resources.Bool(false),
							},
						},
					},
					RestartPolicy: corev1.RestartPolicyOnFailure,
					SecurityContext: &corev1.PodSecurityContext{
						RunAsUser:  resources.Int64(1000),
						RunAsGroup: resources.Int64(3000),
						FSGroup:    resources.Int64(2000),
						SeccompProfile: &corev1.SeccompProfile{
							Type: corev1.SeccompProfileTypeRuntimeDefault,
						},
					},
				},
			},
		},
	}
}

func getVolumes(userEmailID, userAppName string) []corev1.Volume {
	vs := []corev1.Volume{
		{
			Name: resources.WEBTerminalKubeconfigSecretName,
			VolumeSource: corev1.VolumeSource{
				Secret: &corev1.SecretVolumeSource{
					SecretName: handlercommon.KubeconfigSecretName(userEmailID),
				},
			},
		},
		{
			Name: webTerminalStorage,
			VolumeSource: corev1.VolumeSource{
				EmptyDir: &corev1.EmptyDirVolumeSource{
					Medium: corev1.StorageMediumMemory,
				},
			},
		},
		{
			Name: webTerminalConfigVolume,
			VolumeSource: corev1.VolumeSource{
				ConfigMap: &corev1.ConfigMapVolumeSource{
					LocalObjectReference: corev1.LocalObjectReference{
						Name: userAppName,
					},
					Items: []corev1.KeyToPath{
						{
							Key:  expirationTimestampKey,
							Path: "expiration",
						},
						{
							Key:  expirationRefreshesKey,
							Path: "expiration-refreshes",
						},
					},
				},
			},
		},
	}
	return vs
}

func getVolumeMounts() []corev1.VolumeMount {
	return []corev1.VolumeMount{
		{
			Name:      resources.WEBTerminalKubeconfigSecretName,
			MountPath: "/etc/kubernetes/kubeconfig",
			ReadOnly:  true,
		},
		{
			Name:      webTerminalStorage,
			ReadOnly:  false,
			MountPath: "/data/terminal",
		},
		{
			Name:      webTerminalConfigVolume,
			MountPath: "/etc/config",
		},
	}
}

// Terminal is called for any new websocket connection.
func Terminal(ctx context.Context, ws *websocket.Conn, client ctrlruntimeclient.Client, k8sClient kubernetes.Interface, cfg *rest.Config, userEmailID string, cluster *kubermaticv1.Cluster) {
	if err := startProcess(
		ctx,
		client,
		k8sClient,
		cfg,
		userEmailID,
		cluster,
		[]string{"bash", "-c", "cd /data/terminal && /bin/bash"},
		TerminalSession{
			websocketConn: ws,
			userEmailID:   userEmailID,
			clusterClient: client,
		},
		ws); err != nil {
		log.Logger.Debug(err)
		return
	}
}

func EncodeUserEmailtoID(email string) string {
	hasher := md5.New()
	hasher.Write([]byte(email))
	return hex.EncodeToString(hasher.Sum(nil))
}

// WaitFor is a function to wait until callback function return true.
func WaitFor(ctx context.Context, interval time.Duration, timeout time.Duration, callback func(ctx context.Context) bool) bool {
	err := wait.PollUntilContextTimeout(ctx, interval, timeout, true, func(ctx context.Context) (bool, error) {
		return callback(ctx), nil
	})
	return err == nil
}

// SendMessage sends TerminalMessage to the client. It usually contains a context related
// to the status of background tasks responsible for setting up the terminal.
func SendMessage(wsConn *websocket.Conn, message string) error {
	return wsConn.WriteJSON(TerminalMessage{
		Op:   "msg",
		Data: message,
	})
}
