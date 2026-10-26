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

package websocket

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

const testKubeconfig = `apiVersion: v1
kind: Config
current-context: default
clusters:
- name: cluster
  cluster: {server: "https://127.0.0.1:6443"}
contexts:
- name: default
  context: {cluster: cluster, user: user}
users:
- name: user
  user:
    auth-provider:
      name: oidc
      config: {client-id: kubermatic, id-token: TOKEN, idp-issuer-url: "https://dex.example.com/dex"}
`

// runSetup runs writableKubeconfigSetup against a kubeconfig in a temporary directory, then the given shell commands,
// and returns their output and the mounted kubeconfig's path.
func runSetup(t *testing.T, path string, then string) (string, string) {
	t.Helper()
	dir := t.TempDir()
	mounted := filepath.Join(dir, "mounted", "kubeconfig")
	if err := os.MkdirAll(filepath.Dir(mounted), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(mounted, []byte(testKubeconfig), 0o444); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(filepath.Dir(mounted), 0o555); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Chmod(filepath.Dir(mounted), 0o755) })

	script := strings.ReplaceAll(writableKubeconfigSetup, webTerminalContainerKubeconfigPath, mounted)
	script = strings.ReplaceAll(script, "/data/terminal", filepath.Join(dir, "data"))
	cmd := exec.Command("bash", "-c", script+then)
	cmd.Env = []string{"PATH=" + path, "KUBECONFIG=" + mounted, "HOME=" + dir}
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("setup failed: %v\n%s", err, out)
	}
	return string(out), mounted
}

func TestWritableKubeconfigSetup(t *testing.T) {
	kubectl, err := exec.LookPath("kubectl")
	if err != nil {
		t.Skip("kubectl not found")
	}
	path := filepath.Dir(kubectl) + ":/usr/bin:/bin"

	out, mounted := runSetup(t, path, `
echo "KUBECONFIG=$KUBECONFIG"
kubectl config set-context --current --namespace=kube-system > /dev/null
kubectl config view --minify -o jsonpath='namespace={.contexts[0].context.namespace}'; echo
sh "$(dirname "$KUBECONFIG")/token"; echo
`)
	if strings.Contains(out, "KUBECONFIG="+mounted+"\n") {
		t.Fatalf("KUBECONFIG still points at the mounted kubeconfig:\n%s", out)
	}
	if !strings.Contains(out, "namespace=kube-system") {
		t.Errorf("namespace not stored in the writable kubeconfig:\n%s", out)
	}
	if !strings.Contains(out, `"token":"TOKEN"`) {
		t.Errorf("credential plugin did not return the mounted token:\n%s", out)
	}
	if b, _ := os.ReadFile(mounted); string(b) != testKubeconfig {
		t.Errorf("mounted kubeconfig was modified:\n%s", b)
	}
}

func TestWritableKubeconfigSetupFallsBack(t *testing.T) {
	// Without kubectl the setup can't build the copy, and the shell keeps the mounted kubeconfig.
	out, mounted := runSetup(t, t.TempDir(), `echo "KUBECONFIG=$KUBECONFIG"`)
	if !strings.Contains(out, "KUBECONFIG="+mounted) {
		t.Errorf("expected the mounted kubeconfig, got:\n%s", out)
	}
}
