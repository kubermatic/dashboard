/*
Copyright 2026 The Kubermatic Kubernetes Platform contributors.

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

package common

import (
	"context"
	"crypto/md5"
	"encoding/hex"
	"testing"

	"github.com/stretchr/testify/require"

	"k8c.io/kubermatic/v2/pkg/resources"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/types"
	clientcmdapi "k8s.io/client-go/tools/clientcmd/api"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
	ctrlruntimefake "sigs.k8s.io/controller-runtime/pkg/client/fake"
)

func TestCreateKubeconfigSecretSetsWebTerminalLabel(t *testing.T) {
	const email = "bob@acme.com"

	hasher := md5.New()
	hasher.Write([]byte(email))
	secretName := KubeconfigSecretName(hex.EncodeToString(hasher.Sum(nil)))

	testcases := []struct {
		name            string
		inputEmail      string
		existingObjects []ctrlruntimeclient.Object
	}{
		{
			name:       "new Secret is created with the web terminal label",
			inputEmail: email,
		},
		{
			name:       "mixed-case email is lowercased for the Secret name and annotation",
			inputEmail: "Bob@Acme.com",
		},
		{
			name:       "unlabelled Secret from an earlier version gets the label on update",
			inputEmail: email,
			existingObjects: []ctrlruntimeclient.Object{
				&corev1.Secret{
					ObjectMeta: metav1.ObjectMeta{
						Name:        secretName,
						Namespace:   metav1.NamespaceSystem,
						Annotations: map[string]string{"user": email},
					},
					Data: map[string][]byte{resources.KubeconfigSecretKey: []byte("old")},
				},
			},
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			ctx := context.Background()
			client := ctrlruntimefake.NewClientBuilder().WithObjects(tc.existingObjects...).Build()

			require.NoError(t, createKubeconfigSecret(ctx, client, clientcmdapi.NewConfig(), tc.inputEmail))

			secret := &corev1.Secret{}
			require.NoError(t, client.Get(ctx, types.NamespacedName{Namespace: metav1.NamespaceSystem, Name: secretName}, secret))
			require.Equal(t, WebTerminalAppName, secret.Labels[resources.AppLabelKey])
			require.Equal(t, email, secret.Annotations["user"])
			require.NotEqual(t, []byte("old"), secret.Data[resources.KubeconfigSecretKey])
		})
	}
}
