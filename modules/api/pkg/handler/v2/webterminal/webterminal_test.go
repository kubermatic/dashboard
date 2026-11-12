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

package webterminal_test

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"github.com/gorilla/websocket"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
	"k8c.io/dashboard/v2/pkg/handler/test"
	"k8c.io/dashboard/v2/pkg/handler/test/hack"
	wsh "k8c.io/dashboard/v2/pkg/handler/websocket"
	"k8c.io/dashboard/v2/pkg/provider/kubernetes"
	"k8c.io/dashboard/v2/pkg/serviceaccount"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/features"
	"k8c.io/kubermatic/v2/pkg/resources"
	"k8c.io/machine-controller/sdk/providerconfig"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

const (
	testExpectedRedirectURI = ":///api/v2/kubeconfig/secret"
	testClusterName         = "AbcCluster"

	csrfCookieName = "csrf_token"
)

type ExpectedKubeconfigResp struct {
	BodyResponse string
	HTTPStatus   int
}

func TestCreateOIDCKubeconfig(t *testing.T) {
	t.Parallel()
	testcases := []struct {
		Name                      string
		ClusterID                 string
		ProjectID                 string
		UserID                    string
		State                     string
		NonceClaim                string
		HTTPStatusInitPhase       int
		ExistingKubermaticObjects []ctrlruntimeclient.Object
		ExistingObjects           []ctrlruntimeclient.Object
		ExistingAPIUser           *apiv1.User
		ExpectedRedirectURI       string
		ExpectedExchangeCodePhase ExpectedKubeconfigResp
	}{
		{
			Name:                      "scenario 1, no parameters for url",
			HTTPStatusInitPhase:       http.StatusInternalServerError,
			ExistingAPIUser:           test.GenDefaultAPIUser(),
			ExistingKubermaticObjects: genTestKubeconfigKubermaticObjects(),
			ExpectedExchangeCodePhase: ExpectedKubeconfigResp{},
		},
		{
			Name:                "scenario 2, incorrect user ID in state",
			ClusterID:           test.ClusterID,
			ProjectID:           test.GenDefaultProject().Name,
			UserID:              "0000",
			ExistingAPIUser:     test.GenDefaultAPIUser(),
			HTTPStatusInitPhase: http.StatusNotFound,
		},
		{
			Name:                      "scenario 3, exchange phase error: incorrect state parameter",
			ClusterID:                 test.ClusterID,
			ProjectID:                 test.GenDefaultProject().Name,
			UserID:                    test.GenDefaultUser().Name,
			State:                     "abc", // does not match the cookie
			HTTPStatusInitPhase:       http.StatusSeeOther,
			ExistingKubermaticObjects: genTestKubeconfigKubermaticObjects(),
			ExpectedRedirectURI:       testExpectedRedirectURI,
			ExistingAPIUser:           test.GenDefaultAPIUser(),
			ExpectedExchangeCodePhase: ExpectedKubeconfigResp{
				BodyResponse: fmt.Sprintf(`{"error":{"code":400,"message":"incorrect value of state parameter: abc"}}%c`, '\n'),
				HTTPStatus:   http.StatusBadRequest,
			},
		},
		{
			Name:                      "scenario 4, successful scenario",
			ClusterID:                 test.ClusterID,
			ProjectID:                 test.GenDefaultProject().Name,
			UserID:                    test.GenDefaultUser().Name,
			HTTPStatusInitPhase:       http.StatusSeeOther,
			ExistingKubermaticObjects: genTestKubeconfigKubermaticObjects(),
			ExistingObjects: []ctrlruntimeclient.Object{
				&corev1.Secret{
					ObjectMeta: metav1.ObjectMeta{
						Namespace: kubernetes.NamespaceName(test.ClusterID),
						Name:      "admin-kubeconfig",
					},
					Data: map[string][]byte{
						"kubeconfig": []byte(test.GenerateTestKubeconfig(test.ClusterID, test.IDToken)),
					},
				},
			},
			ExpectedRedirectURI: testExpectedRedirectURI,
			ExistingAPIUser:     test.GenDefaultAPIUser(),
			ExpectedExchangeCodePhase: ExpectedKubeconfigResp{
				BodyResponse: "",
				HTTPStatus:   http.StatusOK,
			},
		},
		{
			Name:                      "scenario 5, the admin can get kubeconfig for Bob cluster",
			ClusterID:                 test.ClusterID,
			ProjectID:                 test.GenDefaultProject().Name,
			UserID:                    test.GenAdminUser("john", "john@acme.com", true).Name,
			HTTPStatusInitPhase:       http.StatusSeeOther,
			ExistingKubermaticObjects: genTestKubeconfigKubermaticObjects(),
			ExistingObjects: []ctrlruntimeclient.Object{
				&corev1.Secret{
					ObjectMeta: metav1.ObjectMeta{
						Namespace: kubernetes.NamespaceName(test.ClusterID),
						Name:      "admin-kubeconfig",
					},
					Data: map[string][]byte{
						"kubeconfig": []byte(test.GenerateTestKubeconfig(test.ClusterID, test.IDToken)),
					},
				},
			},
			ExpectedRedirectURI: testExpectedRedirectURI,
			ExistingAPIUser:     test.GenAPIUser("john", "john@acme.com"),
			ExpectedExchangeCodePhase: ExpectedKubeconfigResp{
				BodyResponse: "",
				HTTPStatus:   http.StatusOK,
			},
		},
		{
			Name:                      "scenario 6, exchange phase error: ID token issued for a different nonce",
			ClusterID:                 test.ClusterID,
			ProjectID:                 test.GenDefaultProject().Name,
			UserID:                    test.GenDefaultUser().Name,
			HTTPStatusInitPhase:       http.StatusSeeOther,
			ExistingKubermaticObjects: genTestKubeconfigKubermaticObjects(),
			ExistingObjects: []ctrlruntimeclient.Object{
				&corev1.Secret{
					ObjectMeta: metav1.ObjectMeta{
						Namespace: kubernetes.NamespaceName(test.ClusterID),
						Name:      "admin-kubeconfig",
					},
					Data: map[string][]byte{
						"kubeconfig": []byte(test.GenerateTestKubeconfig(test.ClusterID, test.IDToken)),
					},
				},
			},
			ExpectedRedirectURI: testExpectedRedirectURI,
			NonceClaim:          "nonce-of-another-login",
			ExistingAPIUser:     test.GenDefaultAPIUser(),
			ExpectedExchangeCodePhase: ExpectedKubeconfigResp{
				BodyResponse: "",
				HTTPStatus:   http.StatusBadRequest,
			},
		},
		{
			Name:                      "scenario 7, the web terminal is disabled",
			ClusterID:                 test.ClusterID,
			ProjectID:                 test.GenDefaultProject().Name,
			UserID:                    test.GenDefaultUser().Name,
			HTTPStatusInitPhase:       http.StatusForbidden,
			ExistingKubermaticObjects: genTestKubeconfigKubermaticObjectsWithTerminal(false),
			ExistingAPIUser:           test.GenDefaultAPIUser(),
		},
		{
			Name:                      "scenario 8, exchange phase error: the OIDC login belongs to a different user than user_id",
			ClusterID:                 test.ClusterID,
			ProjectID:                 test.GenDefaultProject().Name,
			UserID:                    test.GenDefaultUser().Name,
			HTTPStatusInitPhase:       http.StatusSeeOther,
			ExistingKubermaticObjects: genTestKubeconfigKubermaticObjects(),
			ExpectedRedirectURI:       testExpectedRedirectURI,
			// the identity provider login is done by John, not by the user in user_id
			ExistingAPIUser: test.GenAPIUser("john", "john@acme.com"),
			ExpectedExchangeCodePhase: ExpectedKubeconfigResp{
				BodyResponse: "",
				HTTPStatus:   http.StatusForbidden,
			},
		},
		{
			Name:                      "scenario 9, the OIDC login email differs from the email of the user only in case",
			ClusterID:                 test.ClusterID,
			ProjectID:                 test.GenDefaultProject().Name,
			UserID:                    test.GenDefaultUser().Name,
			HTTPStatusInitPhase:       http.StatusSeeOther,
			ExistingKubermaticObjects: genTestKubeconfigKubermaticObjects(),
			ExistingObjects: []ctrlruntimeclient.Object{
				&corev1.Secret{
					ObjectMeta: metav1.ObjectMeta{
						Namespace: kubernetes.NamespaceName(test.ClusterID),
						Name:      "admin-kubeconfig",
					},
					Data: map[string][]byte{
						"kubeconfig": []byte(test.GenerateTestKubeconfig(test.ClusterID, test.IDToken)),
					},
				},
			},
			ExpectedRedirectURI: testExpectedRedirectURI,
			// test.GenAPIUser lowercases the email
			ExistingAPIUser: &apiv1.User{
				ObjectMeta: apiv1.ObjectMeta{ID: test.GenDefaultUser().Name, Name: "Bob"},
				Email:      "Bob@Acme.com",
			},
			ExpectedExchangeCodePhase: ExpectedKubeconfigResp{
				BodyResponse: "",
				HTTPStatus:   http.StatusOK,
			},
		},
	}

	for _, tc := range testcases {
		t.Run(tc.Name, func(t *testing.T) {
			reqURL := fmt.Sprintf("/api/v2/kubeconfig/secret?cluster_id=%s&project_id=%s&user_id=%s", tc.ClusterID, tc.ProjectID, tc.UserID)
			req := httptest.NewRequest(http.MethodGet, reqURL, strings.NewReader(""))
			res := httptest.NewRecorder()
			ep, clients, err := test.CreateTestEndpointAndGetClients(*tc.ExistingAPIUser, nil, tc.ExistingObjects, nil, tc.ExistingKubermaticObjects, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}
			clients.FakeOIDCClient.SetNonceClaim(tc.NonceClaim)

			// act
			ep.ServeHTTP(res, req)
			result := res.Result()
			defer result.Body.Close()

			// validate
			assert.Equal(t, tc.HTTPStatusInitPhase, res.Code)

			// Redirection to dex provider
			if res.Code == http.StatusSeeOther {
				location, err := result.Location()
				if err != nil {
					t.Fatalf("expected url for redirection %v", err)
				}

				// validate
				redirectURI := location.Query().Get("redirect_uri")
				assert.Equal(t, tc.ExpectedRedirectURI, redirectURI)
				assert.Equal(t, "S256", location.Query().Get("code_challenge_method"))
				assert.NotEmpty(t, location.Query().Get("nonce"))

				encodedState, err := url.QueryUnescape(location.Query().Get("state"))
				if err != nil {
					t.Fatalf("incorrect state format %v", err)
				}
				decodeState, err := base64.StdEncoding.DecodeString(encodedState)
				if err != nil {
					t.Fatalf("error decoding state %v", err)
				}

				state, err := unmarshalState(decodeState)
				if err != nil {
					t.Fatalf("error unmarshal state %v", err)
				}

				// validate
				assert.Equal(t, tc.ClusterID, state.ClusterID)
				assert.Equal(t, tc.ProjectID, state.ProjectID)
				assert.Equal(t, tc.UserID, state.UserID)

				// override the State if test scenario set the value
				// if not use generated by server
				if tc.State != "" {
					state.State = tc.State
				}

				encodedState, err = marshalEncodeState(state)
				if err != nil {
					t.Fatalf("error marshal state %v", err)
				}
				urlExchangeCodePhase := fmt.Sprintf("/api/v2/kubeconfig/secret?code=%s&state=%s", test.AuthorizationCode, encodedState)

				// call kubeconfig endpoint after authentication
				// exchange code phase
				req = httptest.NewRequest(http.MethodGet, urlExchangeCodePhase, strings.NewReader(""))
				res = httptest.NewRecorder()

				// forward the cookie (nonce and PKCE verifier) set by the server in the initial phase
				for _, cookie := range result.Cookies() {
					if cookie.Name == csrfCookieName {
						req.AddCookie(cookie)
					}
				}

				// act
				ep.ServeHTTP(res, req)
				defer res.Result().Body.Close()

				// validate
				assert.Equal(t, tc.ExpectedExchangeCodePhase.HTTPStatus, res.Code)
			}
		})
	}
}

func TestTerminalRequestIsRejected(t *testing.T) {
	t.Parallel()
	testcases := []struct {
		Name                      string
		ExistingKubermaticObjects []ctrlruntimeclient.Object
		ExistingAPIUser           *apiv1.User
		ExpectedHTTPStatus        int
	}{
		{
			Name:                      "the web terminal is disabled",
			ExistingKubermaticObjects: genTestKubeconfigKubermaticObjectsWithTerminal(false),
			ExistingAPIUser:           test.GenDefaultAPIUser(),
			ExpectedHTTPStatus:        http.StatusForbidden,
		},
		{
			Name:                      "the user is not a member of the project",
			ExistingKubermaticObjects: append(genTestKubeconfigKubermaticObjects(), test.GenUser("", "alice", "alice@acme.com")),
			ExistingAPIUser:           test.GenAPIUser("alice", "alice@acme.com"),
			ExpectedHTTPStatus:        http.StatusForbidden,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.Name, func(t *testing.T) {
			reqURL := fmt.Sprintf("/api/v1/ws/projects/%s/clusters/%s/terminal", test.GenDefaultProject().Name, test.ClusterID)
			req := httptest.NewRequest(http.MethodGet, reqURL, strings.NewReader(""))
			res := httptest.NewRecorder()
			ep, err := test.CreateTestEndpoint(*tc.ExistingAPIUser, nil, tc.ExistingKubermaticObjects, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}

			ep.ServeHTTP(res, req)

			assert.Equal(t, tc.ExpectedHTTPStatus, res.Code)
		})
	}
}

// TestKubeconfigSecretEndpointWithServiceAccountMode checks that the endpoint that stores the
// user's OIDC login in the user cluster is not served when the web terminal runs as a ServiceAccount.
func TestKubeconfigSecretEndpointWithServiceAccountMode(t *testing.T) {
	t.Parallel()
	testcases := []struct {
		Name               string
		FeatureGates       map[string]bool
		ExpectedHTTPStatus int
	}{
		{
			Name:               "feature gate off: the endpoint starts the OIDC login",
			ExpectedHTTPStatus: http.StatusSeeOther,
		},
		{
			Name:               "feature gate on: the endpoint is not served",
			FeatureGates:       map[string]bool{features.WebTerminalServiceAccount: true},
			ExpectedHTTPStatus: http.StatusNotFound,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.Name, func(t *testing.T) {
			reqURL := fmt.Sprintf("/api/v2/kubeconfig/secret?cluster_id=%s&project_id=%s&user_id=%s", test.ClusterID, test.GenDefaultProject().Name, test.GenDefaultUser().Name)
			req := httptest.NewRequest(http.MethodGet, reqURL, strings.NewReader(""))
			res := httptest.NewRecorder()
			config := &kubermaticv1.KubermaticConfiguration{Spec: kubermaticv1.KubermaticConfigurationSpec{FeatureGates: tc.FeatureGates}}
			ep, err := test.CreateTestEndpoint(*test.GenDefaultAPIUser(), nil, genTestKubeconfigKubermaticObjects(), config, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}

			ep.ServeHTTP(res, req)

			assert.Equal(t, tc.ExpectedHTTPStatus, res.Code)
		})
	}
}

// TestTerminalWithServiceAccountMode checks which sessions the web terminal starts as a ServiceAccount
// and which ones it refuses with a message for the dashboard.
func TestTerminalWithServiceAccountMode(t *testing.T) {
	t.Parallel()
	yes, no := true, false
	serviceAccountMode := map[string]bool{features.WebTerminalServiceAccount: true, features.OpenIDAuthPlugin: true}
	authConfig := &kubermaticv1.AuthenticationConfiguration{SecretName: "auth", SecretKey: "config"}
	ownAuthentication := func(cluster *kubermaticv1.Cluster) { cluster.Spec.AuthenticationConfiguration = authConfig }

	userEmailID := wsh.EncodeUserEmailtoID(test.GenDefaultUser().Spec.Email)
	podKey := ctrlruntimeclient.ObjectKey{Namespace: metav1.NamespaceSystem, Name: fmt.Sprintf("%s-%s", handlercommon.WebTerminalAppName, userEmailID)}
	secretKey := ctrlruntimeclient.ObjectKey{Namespace: metav1.NamespaceSystem, Name: handlercommon.KubeconfigSecretName(userEmailID)}

	testcases := []struct {
		Name          string
		FeatureGates  map[string]bool
		ModifyCluster func(*kubermaticv1.Cluster)
		ModifySeed    func(*kubermaticv1.Seed)
		EmailVerified *bool
		// ExpectedRefusal is the message the session is refused with after the websocket upgrade
		ExpectedRefusal wsh.TerminalConnStatus
		// ExpectedPodMode is the mode of the pod of a session that is not refused
		ExpectedPodMode string
	}{
		{
			Name:            "the session is started as a ServiceAccount",
			FeatureGates:    serviceAccountMode,
			EmailVerified:   &yes,
			ExpectedPodMode: "serviceaccount",
		},
		{
			Name:            "the session is started as a ServiceAccount for a token without the email_verified claim",
			FeatureGates:    serviceAccountMode,
			ExpectedPodMode: "serviceaccount",
		},
		{
			Name:            "the cluster has its own AuthenticationConfiguration",
			FeatureGates:    serviceAccountMode,
			ModifyCluster:   ownAuthentication,
			ExpectedRefusal: wsh.WebTerminalAuthenticationUnsupported,
		},
		{
			Name:            "the seed sets an AuthenticationConfiguration",
			FeatureGates:    serviceAccountMode,
			ModifySeed:      func(seed *kubermaticv1.Seed) { seed.Spec.AuthenticationConfiguration = authConfig },
			ExpectedRefusal: wsh.WebTerminalAuthenticationUnsupported,
		},
		{
			Name:            "user clusters do not get the default authentication of KKP",
			FeatureGates:    map[string]bool{features.WebTerminalServiceAccount: true},
			ExpectedRefusal: wsh.WebTerminalAuthenticationDisabled,
		},
		{
			Name:            "the email of the login is not verified",
			FeatureGates:    serviceAccountMode,
			EmailVerified:   &no,
			ExpectedRefusal: wsh.WebTerminalEmailNotVerified,
		},
		{
			// the OIDC mode uses the login the user does in the popup, with the user's own names in the cluster
			Name:          "without the feature gate nothing of this is refused",
			FeatureGates:  map[string]bool{features.OpenIDAuthPlugin: true},
			ModifyCluster: ownAuthentication,
			EmailVerified: &no,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.Name, func(t *testing.T) {
			t.Parallel()
			config := &kubermaticv1.KubermaticConfiguration{Spec: kubermaticv1.KubermaticConfigurationSpec{FeatureGates: tc.FeatureGates}}
			ep, clients, err := test.CreateTestEndpointAndGetClients(*test.GenDefaultAPIUser(), nil, nil, nil, genTestTerminalKubermaticObjects(tc.ModifyCluster, tc.ModifySeed), config, hack.NewTestRouting)
			require.NoError(t, err)
			if tc.EmailVerified != nil {
				clients.FakeOIDCClient.SetEmailVerifiedClaim(*tc.EmailVerified)
			}
			// the Secret an earlier session in the OIDC mode has left in the user cluster
			ctx := context.Background()
			require.NoError(t, clients.FakeSeedClient.Create(ctx, &corev1.Secret{ObjectMeta: metav1.ObjectMeta{Namespace: secretKey.Namespace, Name: secretKey.Name}}))

			conn, status := dialTerminal(t, ep, nil)
			require.Equal(t, http.StatusSwitchingProtocols, status)
			message := readTerminalMessage(t, conn)

			pod := &corev1.Pod{}
			switch {
			case tc.ExpectedRefusal != "":
				assert.Equal(t, string(tc.ExpectedRefusal), message)
				assert.True(t, apierrors.IsNotFound(clients.FakeSeedClient.Get(ctx, podKey, pod)), "a refused session must not get a pod")

			case tc.ExpectedPodMode != "":
				// the first message of a started session is the status of its pod
				require.NoError(t, clients.FakeSeedClient.Get(ctx, podKey, pod), "message: %q", message)
				assert.Equal(t, tc.ExpectedPodMode, pod.Labels["webterminal-mode"])
				assert.Equal(t, podKey.Name, pod.Spec.ServiceAccountName)
				require.Len(t, pod.Spec.Containers, 2)
				assert.Contains(t, pod.Spec.Containers[1].Command, "--as="+test.GenDefaultUser().Spec.Email)
				assert.True(t, apierrors.IsNotFound(clients.FakeSeedClient.Get(ctx, secretKey, &corev1.Secret{})), "the Secret with the OIDC login of the user must be removed")

			default:
				// the OIDC mode waits for the Secret of the login the user is doing in the popup, which the test Secret is
				assert.NotContains(t, message, "WEBTERMINAL_AUTHENTICATION")
				assert.NotEqual(t, string(wsh.WebTerminalEmailNotVerified), message)
				require.NoError(t, clients.FakeSeedClient.Get(ctx, podKey, pod), "message: %q", message)
				assert.Equal(t, "oidc", pod.Labels["webterminal-mode"])
				assert.NoError(t, clients.FakeSeedClient.Get(ctx, secretKey, &corev1.Secret{}))
			}
		})
	}
}

// TestTerminalRefusesLogins checks the logins the web terminal refuses before the websocket upgrade.
func TestTerminalRefusesLogins(t *testing.T) {
	t.Parallel()
	serviceAccountMode := map[string]bool{features.WebTerminalServiceAccount: true, features.OpenIDAuthPlugin: true}
	projectID := test.GenDefaultProject().Name

	// a KKP service account that is an editor of the project
	serviceAccount := test.GenProjectServiceAccount("1", "test-1", "editors", projectID)
	serviceAccountToken, err := genTestServiceAccountToken(serviceAccount, projectID)
	require.NoError(t, err)
	serviceAccountObjects := []ctrlruntimeclient.Object{serviceAccount, test.GenBinding(projectID, serviceAccount.Spec.Email, "editors")}
	serviceAccountHeader := http.Header{"Authorization": []string{"Bearer " + string(serviceAccountToken.Data["token"])}}

	// the user has logged out with the token of the request
	loggedOutUser := test.GenDefaultUser()
	loggedOutUser.Spec.InvalidTokensReference = &providerconfig.GlobalSecretKeySelector{
		ObjectReference: corev1.ObjectReference{
			Name:      loggedOutUser.GetInvalidTokensReferenceSecretName(),
			Namespace: resources.KubermaticNamespace,
		},
	}
	loggedOutTokens := test.GenBlacklistTokenSecret(loggedOutUser.GetInvalidTokensReferenceSecretName(), []byte(fmt.Sprintf(`[{"token":%q,"expiry":"2222-06-20T12:04:00Z"}]`, test.IDToken)))

	testcases := []struct {
		Name               string
		FeatureGates       map[string]bool
		APIUser            apiv1.User
		Header             http.Header
		KubermaticObjects  []ctrlruntimeclient.Object
		KubeObjects        []ctrlruntimeclient.Object
		ExpectedHTTPStatus int
	}{
		{
			Name:               "a token the user has logged out with",
			APIUser:            *test.GenDefaultAPIUser(),
			KubermaticObjects:  replaceObject(genTestTerminalKubermaticObjects(nil, nil), loggedOutUser),
			KubeObjects:        []ctrlruntimeclient.Object{loggedOutTokens},
			ExpectedHTTPStatus: http.StatusUnauthorized,
		},
		{
			Name:               "a token the user has logged out with, ServiceAccount mode",
			FeatureGates:       serviceAccountMode,
			APIUser:            *test.GenDefaultAPIUser(),
			KubermaticObjects:  replaceObject(genTestTerminalKubermaticObjects(nil, nil), loggedOutUser),
			KubeObjects:        []ctrlruntimeclient.Object{loggedOutTokens},
			ExpectedHTTPStatus: http.StatusUnauthorized,
		},
		{
			Name:               "a KKP service account, ServiceAccount mode",
			FeatureGates:       serviceAccountMode,
			APIUser:            apiv1.User{ObjectMeta: apiv1.ObjectMeta{Name: serviceAccount.Name}, Email: serviceAccount.Spec.Email},
			Header:             serviceAccountHeader,
			KubermaticObjects:  append(genTestTerminalKubermaticObjects(nil, nil), serviceAccountObjects...),
			KubeObjects:        []ctrlruntimeclient.Object{serviceAccountToken},
			ExpectedHTTPStatus: http.StatusForbidden,
		},
		{
			// shows that the service account of the case above is refused for being one, not for its access to the cluster
			Name:               "a KKP service account is not refused without the ServiceAccount mode",
			APIUser:            apiv1.User{ObjectMeta: apiv1.ObjectMeta{Name: serviceAccount.Name}, Email: serviceAccount.Spec.Email},
			Header:             serviceAccountHeader,
			KubermaticObjects:  append(genTestTerminalKubermaticObjects(nil, nil), serviceAccountObjects...),
			KubeObjects:        []ctrlruntimeclient.Object{serviceAccountToken},
			ExpectedHTTPStatus: http.StatusSwitchingProtocols,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.Name, func(t *testing.T) {
			t.Parallel()
			config := &kubermaticv1.KubermaticConfiguration{Spec: kubermaticv1.KubermaticConfigurationSpec{FeatureGates: tc.FeatureGates}}
			// the test cases run in parallel and share objects, which the fake clients change
			ep, _, err := test.CreateTestEndpointAndGetClients(tc.APIUser, nil, copyObjects(tc.KubeObjects), nil, copyObjects(tc.KubermaticObjects), config, hack.NewTestRouting)
			require.NoError(t, err)

			_, status := dialTerminal(t, ep, tc.Header)

			assert.Equal(t, tc.ExpectedHTTPStatus, status)
		})
	}
}

// dialTerminal opens the web terminal of the test cluster like the dashboard does. It returns
// the HTTP status of the handshake and, if the handshake was not refused, the connection.
func dialTerminal(t *testing.T, ep http.Handler, header http.Header) (*websocket.Conn, int) {
	t.Helper()

	// the handler serves a session until its context ends, which a closed connection does not do
	ctx, cancel := context.WithCancel(context.Background())
	server := httptest.NewUnstartedServer(ep)
	server.Config.BaseContext = func(net.Listener) context.Context { return ctx }
	server.Start()
	t.Cleanup(func() {
		cancel()
		server.Close()
	})

	terminalURL := fmt.Sprintf("ws%s/api/v1/ws/projects/%s/clusters/%s/terminal", strings.TrimPrefix(server.URL, "http"), test.GenDefaultProject().Name, test.ClusterID)
	conn, res, err := websocket.DefaultDialer.Dial(terminalURL, header)
	if res != nil {
		defer res.Body.Close()
	}
	if err != nil {
		require.NotNil(t, res, "the handshake failed without a response: %v", err)
		return nil, res.StatusCode
	}
	t.Cleanup(func() { conn.Close() })

	return conn, res.StatusCode
}

// readTerminalMessage returns the next message the backend sends to the dashboard.
func readTerminalMessage(t *testing.T, conn *websocket.Conn) string {
	t.Helper()

	require.NoError(t, conn.SetReadDeadline(time.Now().Add(30*time.Second)))
	message := wsh.TerminalMessage{}
	require.NoError(t, conn.ReadJSON(&message))
	require.Equal(t, "msg", message.Op)

	return message.Data
}

// genTestServiceAccountToken returns the Secret with a token of the given KKP service account.
func genTestServiceAccountToken(sa *kubermaticv1.User, projectID string) (*corev1.Secret, error) {
	tokenGenerator, err := serviceaccount.JWTTokenGenerator([]byte(test.TestServiceAccountHashKey))
	if err != nil {
		return nil, err
	}
	token, err := tokenGenerator.Generate(serviceaccount.Claims(sa.Spec.Email, projectID, "test"))
	if err != nil {
		return nil, err
	}

	return &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "sa-token-test",
			Namespace: resources.KubermaticNamespace,
			Labels:    map[string]string{kubermaticv1.ProjectIDLabelKey: projectID, "name": "test"},
			OwnerReferences: []metav1.OwnerReference{
				{
					APIVersion: kubermaticv1.SchemeGroupVersion.String(),
					Kind:       kubermaticv1.UserKindName,
					UID:        sa.GetUID(),
					Name:       sa.Name,
				},
			},
		},
		Type: corev1.SecretTypeOpaque,
		Data: map[string][]byte{"token": []byte(token)},
	}, nil
}

// genTestTerminalKubermaticObjects returns the objects of a project with a cluster its owner can open
// the web terminal for.
func genTestTerminalKubermaticObjects(modifyCluster func(*kubermaticv1.Cluster), modifySeed func(*kubermaticv1.Seed)) []ctrlruntimeclient.Object {
	objects := genTestKubeconfigKubermaticObjects()
	if modifyCluster != nil {
		objects = replaceObject(objects, test.GenCluster(test.ClusterID, testClusterName, test.GenDefaultProject().Name, test.DefaultCreationTimestamp(), modifyCluster))
	}
	if modifySeed != nil {
		objects = replaceObject(objects, test.GenTestSeed(modifySeed))
	}
	return objects
}

// copyObjects returns copies of the given objects.
func copyObjects(objects []ctrlruntimeclient.Object) []ctrlruntimeclient.Object {
	copies := make([]ctrlruntimeclient.Object, 0, len(objects))
	for _, object := range objects {
		copies = append(copies, object.DeepCopyObject().(ctrlruntimeclient.Object))
	}
	return copies
}

// replaceObject replaces the object of the same type and name in the given list.
func replaceObject(objects []ctrlruntimeclient.Object, replacement ctrlruntimeclient.Object) []ctrlruntimeclient.Object {
	result := make([]ctrlruntimeclient.Object, 0, len(objects))
	for _, object := range objects {
		if fmt.Sprintf("%T", object) == fmt.Sprintf("%T", replacement) && object.GetName() == replacement.GetName() {
			object = replacement
		}
		result = append(result, object)
	}
	return result
}

func genTestKubeconfigKubermaticObjects() []ctrlruntimeclient.Object {
	return genTestKubeconfigKubermaticObjectsWithTerminal(true)
}

func genTestKubeconfigKubermaticObjectsWithTerminal(webTerminalEnabled bool) []ctrlruntimeclient.Object {
	return []ctrlruntimeclient.Object{
		&kubermaticv1.KubermaticSetting{
			ObjectMeta: metav1.ObjectMeta{Name: kubermaticv1.GlobalSettingsName},
			Spec: kubermaticv1.SettingSpec{
				WebTerminalOptions: &kubermaticv1.WebTerminalOptions{Enabled: &webTerminalEnabled},
			},
		},
		test.GenTestSeed(),
		// add some project
		test.GenDefaultProject(),
		// add a user
		test.GenDefaultUser(),
		test.GenAdminUser("john", "john@acme.com", true),
		// make the user the owner of the first project and the editor of the second
		test.GenDefaultOwnerBinding(),
		// add a cluster
		test.GenCluster(test.ClusterID, testClusterName, test.GenDefaultProject().Name, test.DefaultCreationTimestamp()),
	}
}

func marshalEncodeState(oidcState handlercommon.OIDCState) (string, error) {
	rawState, err := json.Marshal(oidcState)
	if err != nil {
		return "", err
	}
	encodedState := base64.StdEncoding.EncodeToString(rawState)
	return url.QueryEscape(encodedState), nil
}

func unmarshalState(rawState []byte) (handlercommon.OIDCState, error) {
	oidcState := handlercommon.OIDCState{}
	if err := json.Unmarshal(rawState, &oidcState); err != nil {
		return handlercommon.OIDCState{}, err
	}
	return oidcState, nil
}

func TestCreateOIDCKubeconfigSecretRedirectURI(t *testing.T) {
	t.Parallel()
	const (
		mainWithPort   = "https://kkp.example.com:443/api/v1/kubeconfig"
		mainCustomPath = "https://kkp.example.com/custom/kubeconfig"
	)

	testcases := []struct {
		name                string
		redirectURI         string
		origin              string
		dropStoredRedirect  bool
		expectedRedirectURI string
	}{
		{
			name:                "no origin keeps the main hostname with explicit port",
			redirectURI:         mainWithPort,
			expectedRedirectURI: "https://kkp.example.com:443/api/v2/kubeconfig/secret",
		},
		{
			name:                "main hostname origin keeps the main hostname with explicit port",
			redirectURI:         mainWithPort,
			origin:              "https://kkp.example.com",
			expectedRedirectURI: "https://kkp.example.com:443/api/v2/kubeconfig/secret",
		},
		{
			name:                "main hostname origin with a configured custom path",
			redirectURI:         mainCustomPath,
			origin:              "https://kkp.example.com",
			expectedRedirectURI: "https://kkp.example.com/api/v2/kubeconfig/secret",
		},
		{
			name:                "additional origin redirects back to the proxy hostname",
			redirectURI:         mainWithPort,
			origin:              "https://kkp-proxy.example.com",
			expectedRedirectURI: "https://kkp-proxy.example.com/api/v2/kubeconfig/secret",
		},
		{
			name:                "unlisted origin keeps the main hostname",
			redirectURI:         mainWithPort,
			origin:              "https://evil.example.com",
			expectedRedirectURI: "https://kkp.example.com:443/api/v2/kubeconfig/secret",
		},
		{
			name:                "cookie without a redirect URI from before the upgrade uses the main hostname",
			redirectURI:         mainWithPort,
			dropStoredRedirect:  true,
			expectedRedirectURI: "https://kkp.example.com:443/api/v2/kubeconfig/secret",
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			ep, clients, err := test.CreateTestEndpointAndGetClients(*test.GenDefaultAPIUser(), nil, []ctrlruntimeclient.Object{
				&corev1.Secret{
					ObjectMeta: metav1.ObjectMeta{
						Namespace: kubernetes.NamespaceName(test.ClusterID),
						Name:      "admin-kubeconfig",
					},
					Data: map[string][]byte{
						"kubeconfig": []byte(test.GenerateTestKubeconfig(test.ClusterID, test.IDToken)),
					},
				},
			}, nil, genTestKubeconfigKubermaticObjects(), nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}
			clients.FakeOIDCClient.SetRedirectURI(tc.redirectURI)
			clients.FakeOIDCClient.SetAdditionalRedirectURIs("https://kkp-proxy.example.com")

			reqURL := fmt.Sprintf("/api/v2/kubeconfig/secret?cluster_id=%s&project_id=%s&user_id=%s&origin=%s", test.ClusterID, test.GenDefaultProject().Name, test.GenDefaultUser().Name, url.QueryEscape(tc.origin))
			res := httptest.NewRecorder()
			ep.ServeHTTP(res, httptest.NewRequest(http.MethodGet, reqURL, nil))
			if res.Code != http.StatusSeeOther {
				t.Fatalf("expected status %d, got %d: %s", http.StatusSeeOther, res.Code, res.Body.String())
			}

			location, err := res.Result().Location()
			if err != nil {
				t.Fatalf("expected url for redirection: %v", err)
			}
			assert.Equal(t, tc.expectedRedirectURI, location.Query().Get("redirect_uri"))

			cookie := test.GetCookie(res.Result().Cookies(), csrfCookieName)
			if cookie == nil {
				t.Fatalf("cookie %q not set", csrfCookieName)
			}
			if tc.dropStoredRedirect {
				if cookie, err = test.WithoutStoredRedirectURI(cookie); err != nil {
					t.Fatalf("failed to re-sign the state cookie: %v", err)
				}
			}

			// the fake provider rejects a token request whose redirect_uri differs from the authorization request
			req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/v2/kubeconfig/secret?code=%s&state=%s", test.AuthorizationCode, url.QueryEscape(location.Query().Get("state"))), nil)
			req.AddCookie(cookie)
			res = httptest.NewRecorder()
			ep.ServeHTTP(res, req)
			assert.Equal(t, http.StatusOK, res.Code, res.Body.String())
		})
	}
}
