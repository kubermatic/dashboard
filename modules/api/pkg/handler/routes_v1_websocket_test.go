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

package handler

import (
	"testing"
)

func TestUnsupportedLoginReason(t *testing.T) {
	yes, no := true, false

	testcases := []struct {
		name          string
		email         string
		emailVerified *bool
		supported     bool
	}{
		{name: "token without the email_verified claim", email: "alice@example.com", supported: true},
		{name: "verified email", email: "alice@example.com", emailVerified: &yes, supported: true},
		{name: "unverified email", email: "alice@example.com", emailVerified: &no},
		{name: "service account", email: "serviceaccount-abc123@example.com"},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			if reason := unsupportedLoginReason(tc.email, tc.emailVerified); (reason == "") != tc.supported {
				t.Errorf("expected supported=%v, got reason %q", tc.supported, reason)
			}
		})
	}
}
