//go:build ee

/*
                  Kubermatic Enterprise Read-Only License
                         Version 1.0 ("KERO-1.0”)
                     Copyright © 2026 Kubermatic GmbH

   1.	You may only view, read and display for studying purposes the source
      code of the software licensed under this license, and, to the extent
      explicitly provided under this license, the binary code.
   2.	Any use of the software which exceeds the foregoing right, including,
      without limitation, its execution, compilation, copying, modification
      and distribution, is expressly prohibited.
   3.	THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
      EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
      IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
      CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
      TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
      SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

   END OF TERMS AND CONDITIONS
*/

package clusterbackup

import (
	"testing"
)

func TestNormalizeDurationDays(t *testing.T) {
	testCases := []struct {
		name     string
		ttl      string
		expected string
		wantErr  bool
	}{
		{name: "days only", ttl: "7d", expected: "168h"},
		{name: "days and hours", ttl: "1d12h", expected: "36h"},
		{name: "days hours minutes", ttl: "1d12h30m", expected: "36h30m"},
		{name: "days and minutes", ttl: "1d30m", expected: "24h30m"},
		{name: "fully spelled", ttl: "7d0h0m0s", expected: "168h0m0s"},
		{name: "hours untouched", ttl: "168h", expected: "168h"},
		{name: "hms untouched", ttl: "24h10m10s", expected: "24h10m10s"},
		{name: "zero untouched", ttl: "0", expected: "0"},
		{name: "empty untouched", ttl: "", expected: ""},
		{name: "hours overflow after days", ttl: "1d24h", wantErr: true},
		{name: "garbage after days", ttl: "1dfoo", wantErr: true},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := NormalizeDurationDays(tc.ttl)
			if tc.wantErr {
				if err == nil {
					t.Fatalf("expected error for %q, got %q", tc.ttl, got)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error for %q: %v", tc.ttl, err)
			}
			if got != tc.expected {
				t.Errorf("NormalizeDurationDays(%q) = %q, expected %q", tc.ttl, got, tc.expected)
			}
		})
	}
}

func TestNormalizeBodyDuration(t *testing.T) {
	testCases := []struct {
		name     string
		body     string
		path     []string
		expected string
		wantErr  bool
	}{
		{
			name:     "backup ttl in days",
			body:     `{"name":"b","spec":{"ttl":"7d","includedNamespaces":["a"]}}`,
			path:     []string{"spec", "ttl"},
			expected: `{"name":"b","spec":{"includedNamespaces":["a"],"ttl":"168h"}}`,
		},
		{
			name:     "schedule template ttl in days",
			body:     `{"name":"s","spec":{"schedule":"0 3 * * *","template":{"ttl":"1d12h"}}}`,
			path:     []string{"spec", "template", "ttl"},
			expected: `{"name":"s","spec":{"schedule":"0 3 * * *","template":{"ttl":"36h"}}}`,
		},
		{
			name:     "ttl without days is passed through byte for byte",
			body:     `{"spec":{"ttl":"168h","uploaderConfig":{"parallelFilesUpload": 2}}}`,
			path:     []string{"spec", "ttl"},
			expected: `{"spec":{"ttl":"168h","uploaderConfig":{"parallelFilesUpload": 2}}}`,
		},
		{
			name:     "missing ttl is passed through",
			body:     `{"spec":{}}`,
			path:     []string{"spec", "ttl"},
			expected: `{"spec":{}}`,
		},
		{
			name:     "missing path segment is passed through",
			body:     `{"name":"s"}`,
			path:     []string{"spec", "template", "ttl"},
			expected: `{"name":"s"}`,
		},
		{
			name:     "bsl sync period in days",
			body:     `{"cbslName":"c","bslSpec":{"backupSyncPeriod":"1d"}}`,
			path:     []string{"bslSpec", "backupSyncPeriod"},
			expected: `{"bslSpec":{"backupSyncPeriod":"24h"},"cbslName":"c"}`,
		},
		{
			name:     "cbsl sync period in days",
			body:     `{"name":"c","cbslSpec":{"backupSyncPeriod":"1d12h"}}`,
			path:     []string{"cbslSpec", "backupSyncPeriod"},
			expected: `{"cbslSpec":{"backupSyncPeriod":"36h"},"name":"c"}`,
		},
		{
			name:    "invalid day ttl is rejected",
			body:    `{"spec":{"ttl":"1d24h"}}`,
			path:    []string{"spec", "ttl"},
			wantErr: true,
		},
		{
			name:    "invalid json is rejected",
			body:    `{"spec":`,
			path:    []string{"spec", "ttl"},
			wantErr: true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := NormalizeBodyDuration([]byte(tc.body), tc.path...)
			if tc.wantErr {
				if err == nil {
					t.Fatalf("expected error, got %s", got)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if string(got) != tc.expected {
				t.Errorf("NormalizeBodyDuration() = %s, expected %s", got, tc.expected)
			}
		})
	}
}
