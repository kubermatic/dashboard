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
	"time"

	velerov1 "github.com/vmware-tanzu/velero/pkg/apis/velero/v1"

	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
)

func TestFromUnstructured(t *testing.T) {
	newSchedule := func(ttl string) unstructured.Unstructured {
		return unstructured.Unstructured{Object: map[string]interface{}{
			"apiVersion": "velero.io/v1",
			"kind":       "Schedule",
			"metadata":   map[string]interface{}{"name": "s", "namespace": "velero"},
			"spec": map[string]interface{}{
				"schedule": "0 3 * * *",
				"template": map[string]interface{}{"ttl": ttl},
			},
		}}
	}

	t.Run("valid ttl is decoded", func(t *testing.T) {
		schedule := &velerov1.Schedule{}
		if err := FromUnstructured(newSchedule("168h"), schedule); err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if schedule.Name != "s" || schedule.Spec.Template.TTL.Duration != 168*time.Hour {
			t.Errorf("decoded %+v", schedule.Spec)
		}
	})

	t.Run("day unit ttl is reported instead of decoded", func(t *testing.T) {
		schedule := &velerov1.Schedule{}
		if err := FromUnstructured(newSchedule("7d0h"), schedule); err == nil {
			t.Fatalf("expected error, got %+v", schedule.Spec)
		}
	})
}
