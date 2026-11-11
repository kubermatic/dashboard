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
	"crypto/md5"
	"encoding/hex"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	handlercommon "k8c.io/dashboard/v2/pkg/handler/common"
)

// TestWebTerminalCleanupJobScript runs the cleanup Job script for an expired session
// with a fake kubectl and checks which deletions it runs and how it exits.
func TestWebTerminalCleanupJobScript(t *testing.T) {
	bash, err := exec.LookPath("bash")
	if err != nil {
		t.Skip("bash is not available")
	}

	userEmailID := EncodeUserEmailtoID("bob@acme.com")
	job := genWebTerminalCleanupJob(userAppName(userEmailID), userEmailID, "abcd1234", "")
	container := job.Spec.Template.Spec.Containers[0]
	podDelete := "delete pod " + userAppName(userEmailID)
	secretDelete := "delete secret " + handlercommon.KubeconfigSecretName(userEmailID)

	testcases := []struct {
		name              string
		podDeleteFails    bool
		secretDeleteFails bool
		expectedExitCode  int
	}{
		{
			name:             "pod and Secret are deleted",
			expectedExitCode: 0,
		},
		{
			name:             "Secret is deleted even if the pod can't be removed, and the script fails",
			podDeleteFails:   true,
			expectedExitCode: 1,
		},
		{
			name:              "failed Secret deletion fails the script",
			secretDeleteFails: true,
			expectedExitCode:  1,
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			dir := t.TempDir()
			logFile := filepath.Join(dir, "kubectl.log")

			// the fake kubectl logs its arguments and prints nothing, so the script sees no
			// ConfigMap data and treats the session as expired
			fakeKubectl := "#!/bin/sh\necho \"$@\" >> " + logFile + "\n"
			if tc.podDeleteFails {
				fakeKubectl += "if [ \"$1 $2\" = \"delete pod\" ]; then exit 1; fi\n"
			}
			if tc.secretDeleteFails {
				fakeKubectl += "if [ \"$1 $2\" = \"delete secret\" ]; then exit 1; fi\n"
			}
			if err := os.WriteFile(filepath.Join(dir, "kubectl"), []byte(fakeKubectl), 0o755); err != nil {
				t.Fatal(err)
			}

			cmd := exec.Command(bash, append(container.Command[1:], container.Args...)...)
			cmd.Env = append(os.Environ(), "PATH="+dir+":"+os.Getenv("PATH"))
			for _, env := range container.Env {
				cmd.Env = append(cmd.Env, env.Name+"="+env.Value)
			}

			exitCode := 0
			if err := cmd.Run(); err != nil {
				var exitErr *exec.ExitError
				if !errors.As(err, &exitErr) {
					t.Fatal(err)
				}
				exitCode = exitErr.ExitCode()
			}
			if exitCode != tc.expectedExitCode {
				t.Errorf("expected exit code %d, got %d", tc.expectedExitCode, exitCode)
			}

			calls, err := os.ReadFile(logFile)
			if err != nil {
				t.Fatal(err)
			}
			kubectlCalls := string(calls)
			// the timeout keeps a pod stuck in deletion from blocking the Secret deletion
			podIndex := strings.Index(kubectlCalls, podDelete+" -n kube-system --timeout=60s")
			secretIndex := strings.Index(kubectlCalls, secretDelete)
			if podIndex == -1 || secretIndex == -1 {
				t.Fatalf("expected the script to delete the pod with a timeout and the Secret, kubectl calls:\n%s", kubectlCalls)
			}
			if secretIndex < podIndex {
				t.Fatalf("expected the Secret to be deleted after the pod, kubectl calls:\n%s", kubectlCalls)
			}
			// every delete counts for the exit code, so an object that is already gone must not fail it
			for _, call := range strings.Split(strings.TrimSpace(kubectlCalls), "\n") {
				if strings.HasPrefix(call, "delete ") && !strings.Contains(call, "--ignore-not-found") {
					t.Errorf("expected %q to use --ignore-not-found", call)
				}
			}
		})
	}
}

func TestEncodeUserEmailtoIDMatchesKubeconfigSecretName(t *testing.T) {
	// createKubeconfigSecret names the Secret after the md5 of the lowercased email,
	// so the web terminal must use the same ID for every casing of the email
	hash := md5.Sum([]byte("bob@acme.com"))
	expected := hex.EncodeToString(hash[:])

	for _, email := range []string{"bob@acme.com", "Bob@Acme.com", "BOB@ACME.COM"} {
		if got := EncodeUserEmailtoID(email); got != expected {
			t.Errorf("EncodeUserEmailtoID(%q) = %q, expected %q", email, got, expected)
		}
	}
}
