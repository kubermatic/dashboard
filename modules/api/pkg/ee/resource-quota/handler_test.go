//go:build ee

/*
                  Kubermatic Enterprise Read-Only License
                         Version 1.0 ("KERO-1.0”)
                     Copyright © 2022 Kubermatic GmbH

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

package resourcequota_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	resourcequota "k8c.io/dashboard/v2/pkg/ee/resource-quota"
	"k8c.io/dashboard/v2/pkg/handler/test"
	"k8c.io/dashboard/v2/pkg/handler/test/hack"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"
	"k8c.io/kubermatic/v2/pkg/test/diff"

	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/utils/ptr"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

func TestHandlerResourceQuotas(t *testing.T) {
	t.Parallel()

	rq1 := &kubermaticv1.ResourceQuota{
		ObjectMeta: metav1.ObjectMeta{
			Name: fmt.Sprintf("project-%s", projectName),
			Labels: map[string]string{
				kubermaticv1.ResourceQuotaSubjectKindLabelKey:  kubermaticv1.ProjectSubjectKind,
				kubermaticv1.ResourceQuotaSubjectNameLabelKey:  projectName,
				resourcequota.DefaultProjectResourceQuotaLabel: "true",
			},
		},
		Spec: kubermaticv1.ResourceQuotaSpec{
			Subject: kubermaticv1.Subject{
				Name: projectName,
				Kind: kubermaticv1.ProjectSubjectKind,
			},
			Quota: genQuota(resource.MustParse("5"), resource.MustParse("1235M"), resource.MustParse("125Gi")),
		},
		Status: kubermaticv1.ResourceQuotaStatus{
			GlobalUsage: genQuota(resource.MustParse("2"), resource.MustParse("35M"), resource.MustParse("100Gi")),
		},
	}
	rq2 := &kubermaticv1.ResourceQuota{
		ObjectMeta: metav1.ObjectMeta{
			Name: fmt.Sprintf("project-%s", anotherProjectName),
			Labels: map[string]string{
				kubermaticv1.ResourceQuotaSubjectKindLabelKey: kubermaticv1.ProjectSubjectKind,
				kubermaticv1.ResourceQuotaSubjectNameLabelKey: anotherProjectName,
			},
		},
		Spec: kubermaticv1.ResourceQuotaSpec{
			Subject: kubermaticv1.Subject{
				Name: anotherProjectName,
				Kind: kubermaticv1.ProjectSubjectKind,
			},
			Quota: genQuota(resource.MustParse("0"), resource.MustParse("1234M"), resource.MustParse("0")),
		},
		Status: kubermaticv1.ResourceQuotaStatus{
			GlobalUsage: genQuota(resource.MustParse("0"), resource.MustParse("300M"), resource.MustParse("0")),
		},
	}

	admin := test.GenAdminUser("John", "john@acme.com", true)
	project2 := test.GenProject("my-second-project", kubermaticv1.ProjectActive, test.DefaultCreationTimestamp())
	existingObjects := test.GenDefaultKubermaticObjects(rq1, rq2, admin, project2)

	testcases := []struct {
		name             string
		method           string
		url              string
		body             string
		existingAPIUser  *apiv1.User
		existingObjects  []ctrlruntimeclient.Object
		httpStatus       int
		expectedResponse string
		validateResp     func(resp *httptest.ResponseRecorder) error
	}{
		{
			name:            "scenario 1: list all resource quotas with proper quota conversion",
			method:          http.MethodGet,
			url:             "/api/v2/quotas",
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
			existingObjects: existingObjects,
			httpStatus:      http.StatusOK,
			validateResp: func(resp *httptest.ResponseRecorder) error {
				resourceQuotaList := &[]apiv2.ResourceQuota{}
				err := json.Unmarshal(resp.Body.Bytes(), resourceQuotaList)
				if err != nil {
					return err
				}
				listLen := len(*resourceQuotaList)
				if listLen != 2 {
					return fmt.Errorf("expected list length %d, got %d", 2, listLen)
				}
				for _, rq := range *resourceQuotaList {
					var expectedQuota apiv2.Quota
					if rq.Name == rq1.Name {
						expectedQuota = genAPIQuota(5, 1.24, 134.22)
					} else {
						expectedQuota = genAPIQuota(0, 1.23, 0)
					}
					if !diff.DeepEqual(expectedQuota, rq.Quota) {
						return fmt.Errorf("Objects differ:\n%v", diff.ObjectDiff(expectedQuota, rq.Quota))
					}
					if rq.SubjectHumanReadableName != strings.TrimSuffix(rq.SubjectName, "-ID") {
						return fmt.Errorf(
							"human-readable name is not correct: expected %s, got %s",
							projectName,
							rq.SubjectHumanReadableName,
						)
					}
				}
				return nil
			},
		},
		{
			name:            "scenario 2: list filtered resource quotas",
			method:          http.MethodGet,
			url:             fmt.Sprintf("/api/v2/quotas?subjectName=%s", projectName),
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
			existingObjects: existingObjects,
			httpStatus:      http.StatusOK,
			validateResp: func(resp *httptest.ResponseRecorder) error {
				resourceQuotaList := &[]apiv2.ResourceQuota{}
				err := json.Unmarshal(resp.Body.Bytes(), resourceQuotaList)
				if err != nil {
					return err
				}
				listLen := len(*resourceQuotaList)
				expectedListLen := 1
				if listLen != expectedListLen {
					return fmt.Errorf("expected list length %d, got %d", expectedListLen, listLen)
				}
				return nil
			},
		},
		{
			name:            "scenario 3: list accumulated resource quotas",
			method:          http.MethodGet,
			url:             "/api/v2/quotas?accumulate=true",
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
			existingObjects: existingObjects,
			httpStatus:      http.StatusOK,
			validateResp: func(resp *httptest.ResponseRecorder) error {
				resourceQuotaList := []apiv2.ResourceQuota{}
				err := json.Unmarshal(resp.Body.Bytes(), &resourceQuotaList)
				if err != nil {
					return err
				}
				listLen := len(resourceQuotaList)
				if listLen != 1 {
					return fmt.Errorf("expected list length %d, got %d", 1, listLen)
				}
				quota := resourceQuotaList[0]
				expectedQuota := genAPIQuota(5, 2.47, 134.22)
				if !diff.DeepEqual(expectedQuota, quota.Quota) {
					return fmt.Errorf("Objects differ:\n%v", diff.ObjectDiff(expectedQuota, quota.Quota))
				}

				expectedUsage := genAPIQuota(2, 0.34, 107.37)
				if !diff.DeepEqual(expectedUsage, quota.Status.GlobalUsage) {
					return fmt.Errorf("Objects differ:\n%v", diff.ObjectDiff(expectedQuota, quota.Status.GlobalUsage))
				}

				return nil
			},
		},
		{
			name:            "scenario 4: get a single resource quota",
			method:          http.MethodGet,
			url:             fmt.Sprintf("/api/v2/quotas/project-%s", projectName),
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
			existingObjects: existingObjects,
			httpStatus:      http.StatusOK,
			validateResp: func(resp *httptest.ResponseRecorder) error {
				resourceQuota := &apiv2.ResourceQuota{}
				err := json.Unmarshal(resp.Body.Bytes(), resourceQuota)
				if err != nil {
					return err
				}
				expectedName := fmt.Sprintf("project-%s", projectName)
				if resourceQuota.Name != expectedName {
					return fmt.Errorf("expected name %s, got %s", expectedName, resourceQuota.Name)
				}
				expectedHumanReadableName := strings.TrimSuffix(resourceQuota.SubjectName, "-ID")
				if resourceQuota.SubjectHumanReadableName != expectedHumanReadableName {
					return fmt.Errorf(
						"expected name %s, got %s",
						expectedHumanReadableName,
						resourceQuota.SubjectHumanReadableName,
					)
				}
				if !resourceQuota.IsDefault {
					return fmt.Errorf("expected the quota to be a default quota")
				}
				return nil
			},
		},
		{
			name:            "scenario 5: get a non-existing single resource quota",
			method:          http.MethodGet,
			url:             "/api/v2/quotas/project-non-existing",
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
			existingObjects: existingObjects,
			httpStatus:      http.StatusNotFound,
			validateResp: func(resp *httptest.ResponseRecorder) error {
				return nil
			},
		},
		{
			name:   "scenario 6: create an existing resource quota",
			method: http.MethodPost,
			url:    "/api/v2/quotas",
			body: `{
		      "subjectKind": "project",
		      "subjectName": "` + projectName + `"
			}`,
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
			existingObjects: existingObjects,
			httpStatus:      http.StatusConflict,
			validateResp: func(resp *httptest.ResponseRecorder) error {
				return nil
			},
		},
		{
			name:   "scenario 7: create a new resource quota",
			method: http.MethodPost,
			url:    "/api/v2/quotas",
			body: `{
		      "subjectKind": "project",
		      "subjectName": "testproject",
				"quota": {
					"cpu": 10,
					"memory": 64,
					"storage": 256.5
				}
			}`,
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
			existingObjects: existingObjects,
			httpStatus:      http.StatusCreated,
			validateResp: func(resp *httptest.ResponseRecorder) error {
				return nil
			},
		},
		{
			name:   "scenario 8: update an existing resource quota",
			method: http.MethodPut,
			url:    fmt.Sprintf("/api/v2/quotas/project-%s", projectName),
			body: `{
				"cpu": 10,
				"memory": 64,
				"storage": 256.5
			}`,
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
			existingObjects: existingObjects,
			httpStatus:      http.StatusOK,
			validateResp: func(resp *httptest.ResponseRecorder) error {
				resourceQuota := &apiv2.ResourceQuota{}
				err := json.Unmarshal(resp.Body.Bytes(), resourceQuota)
				if err != nil {
					return err
				}

				if resourceQuota.IsDefault {
					return fmt.Errorf("expected the quota not to be a default quota")
				}

				return nil
			},
		},
		{
			name:   "scenario 9: update a non-existing resource quota",
			method: http.MethodPut,
			url:    "/api/v2/quotas/project-non-existing",
			body: `{
				"cpu": 10,
				"memory": 64,
				"storage": 256.5
			}`,
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
			existingObjects: existingObjects,
			httpStatus:      http.StatusNotFound,
			validateResp: func(resp *httptest.ResponseRecorder) error {
				return nil
			},
		},
		{
			name:            "scenario 10: delete an existing resource quota",
			method:          http.MethodDelete,
			url:             fmt.Sprintf("/api/v2/quotas/project-%s", projectName),
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
			existingObjects: existingObjects,
			httpStatus:      http.StatusOK,
			validateResp: func(resp *httptest.ResponseRecorder) error {
				return nil
			},
		},
		{
			name:            "scenario 11: delete a non-existing resource quota",
			method:          http.MethodDelete,
			url:             "/api/v2/quotas/project-non-existing",
			existingAPIUser: test.GenAPIUser("John", "john@acme.com"),
			existingObjects: existingObjects,
			httpStatus:      http.StatusNotFound,
			validateResp: func(resp *httptest.ResponseRecorder) error {
				return nil
			},
		},
		{
			name:            "scenario 12: get a project resource quota",
			method:          http.MethodGet,
			url:             fmt.Sprintf("/api/v2/projects/%s/quota", projectName),
			existingAPIUser: test.GenDefaultAPIUser(),
			existingObjects: existingObjects,
			httpStatus:      http.StatusOK,
			validateResp: func(resp *httptest.ResponseRecorder) error {
				resourceQuota := &apiv2.ResourceQuota{}
				err := json.Unmarshal(resp.Body.Bytes(), resourceQuota)
				if err != nil {
					return err
				}
				expectedName := fmt.Sprintf("project-%s", projectName)
				if resourceQuota.Name != expectedName {
					return fmt.Errorf("expected name %s, got %s", expectedName, resourceQuota.Name)
				}
				expectedHumanReadableName := strings.TrimSuffix(resourceQuota.SubjectName, "-ID")
				if resourceQuota.SubjectHumanReadableName != expectedHumanReadableName {
					return fmt.Errorf("expected name %s, got %s", expectedHumanReadableName, resourceQuota.Name)
				}
				return nil
			},
		},
		{
			name:            "scenario 13: user bob can't get a project resource quota from a project he doesn't belong to",
			method:          http.MethodGet,
			url:             fmt.Sprintf("/api/v2/projects/%s-2/quota", projectName),
			existingAPIUser: test.GenDefaultAPIUser(),
			existingObjects: append(existingObjects, func() *kubermaticv1.Project {
				p := test.GenDefaultProject()
				p.Name = fmt.Sprintf("%s-2", projectName)
				return p
			}()),
			httpStatus: http.StatusForbidden,
			validateResp: func(resp *httptest.ResponseRecorder) error {
				return nil
			},
		},
	}

	for _, tc := range testcases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest(tc.method, tc.url, strings.NewReader(tc.body))
			res := httptest.NewRecorder()

			router, err := test.CreateTestEndpoint(*tc.existingAPIUser, nil, tc.existingObjects, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint")
			}
			router.ServeHTTP(res, req)

			if res.Code != tc.httpStatus {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.httpStatus, res.Code, res.Body.String())
			}

			err = tc.validateResp(res)
			if err != nil {
				t.Fatal(err)
			}
		})
	}
}

func TestCalculateResourceQuotaUpdate(t *testing.T) {
	t.Parallel()
	testCases := []struct {
		Name                      string
		ProjectID                 string
		ExistingKubermaticObjects []ctrlruntimeclient.Object
		ExistingAPIUser           *apiv1.User
		RequestBody               []byte
		ExpectedHTTPStatusCode    int
		ExpectedResponse          *apiv2.ResourceQuotaUpdateCalculation
	}{
		{
			Name:                      "should get empty response if resource quota does not exist for the project",
			ProjectID:                 test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(),
			ExistingAPIUser:           test.GenDefaultAPIUser(),
			RequestBody:               newCalcReq().encode(t),
			ExpectedHTTPStatusCode:    http.StatusOK,
			ExpectedResponse:          nil,
		},
		{
			Name:                      "should not let non-project user to access the resource",
			ProjectID:                 test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(),
			ExistingAPIUser:           test.GenAPIUser("bob", "bob@bob"),
			RequestBody:               newCalcReq().encode(t),
			ExpectedHTTPStatusCode:    http.StatusForbidden,
			ExpectedResponse:          nil,
		},
		{
			Name:      "should notify when quota is exceeded",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("12", "10G", "30G").
					withGlobalUsage("2", "3G", "5G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withDiskSize(30).
				withAWS(2, 3).
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(12, 10, 30)).
				withGlobalUsage(genAPIQuota(2, 3, 5)).
				withCalculatedQuota(genAPIQuota(6, 9, 65)).
				withMessage("Calculated disk size (65G) exceeds resource quota (30G)").
				build(),
		},
		{
			Name:      "should process aws request successfully",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("12", "10G", "30G").
					withGlobalUsage("2", "3G", "5G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withDiskSize(10).
				withAWS(2, 3).
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(12, 10, 30)).
				withGlobalUsage(genAPIQuota(2, 3, 5)).
				withCalculatedQuota(genAPIQuota(6, 9, 25)).
				build(),
		},
		{
			Name:      "should process alibaba request successfully",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("12", "10G", "30G").
					withGlobalUsage("2", "3G", "5G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withDiskSize(10).
				withAlibaba(2, 3).
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(12, 10, 30)).
				withGlobalUsage(genAPIQuota(2, 3, 5)).
				withCalculatedQuota(genAPIQuota(6, 9, 25)).
				build(),
		},
		{
			Name:      "should process anexia request successfully",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("12", "10G", "30G").
					withGlobalUsage("2", "3G", "5G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withAnexia(2, 3000, 10).
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(12, 10, 30)).
				withGlobalUsage(genAPIQuota(2, 3, 5)).
				withCalculatedQuota(genAPIQuota(6, 9, 25)).
				build(),
		},
		{
			Name:      "should process azure request successfully",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("12", "10G", "30G").
					withGlobalUsage("2", "3G", "5G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withAzure(2, 3000, 10000).
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(12, 10, 30)).
				withGlobalUsage(genAPIQuota(2, 3, 5)).
				withCalculatedQuota(genAPIQuota(6, 9, 25)).
				build(),
		},
		{
			Name:      "should process digitalocean request successfully",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("12", "10G", "30G").
					withGlobalUsage("2", "3G", "5G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withDO(2, 3000, 10).
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(12, 10, 30)).
				withGlobalUsage(genAPIQuota(2, 3, 5)).
				withCalculatedQuota(genAPIQuota(6, 9, 25)).
				build(),
		},
		{
			Name:      "should process gcp request successfully",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("12", "10G", "30G").
					withGlobalUsage("2", "3G", "5G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withDiskSize(10).
				withGCP(2, 3000).
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(12, 10, 30)).
				withGlobalUsage(genAPIQuota(2, 3, 5)).
				withCalculatedQuota(genAPIQuota(6, 9, 25)).
				build(),
		},
		{
			Name:      "should process hetzner request successfully",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("12", "10G", "30G").
					withGlobalUsage("2", "3G", "5G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withHetzner(2, 3, 10).
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(12, 10, 30)).
				withGlobalUsage(genAPIQuota(2, 3, 5)).
				withCalculatedQuota(genAPIQuota(6, 9, 25)).
				build(),
		},
		{
			Name:      "should process kubevirt request successfully",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("12", "10G", "30G").
					withGlobalUsage("2", "3G", "5G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withKubevirt("2", "3G", "7G", "3G").
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(12, 10, 30)).
				withGlobalUsage(genAPIQuota(2, 3, 5)).
				withCalculatedQuota(genAPIQuota(6, 9, 25)).
				build(),
		},
		{
			Name:      "should process nutanix request successfully",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("12", "10G", "30G").
					withGlobalUsage("2", "3G", "5G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withNutanix(2, 3000, 10, true).
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(12, 10, 30)).
				withGlobalUsage(genAPIQuota(2, 3, 5)).
				withCalculatedQuota(genAPIQuota(6, 9, 25)).
				build(),
		},
		{
			Name:      "should process openstack request successfully",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("12", "10G", "30G").
					withGlobalUsage("2", "3G", "5G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withOpenstack(2, 3000, 10, 0).
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(12, 10, 30)).
				withGlobalUsage(genAPIQuota(2, 3, 5)).
				withCalculatedQuota(genAPIQuota(6, 9, 25)).
				build(),
		},
		{
			Name:      "should process openstack request with custom disk successfully",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("12", "10G", "50G").
					withGlobalUsage("2", "3G", "5G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withOpenstack(2, 3000, 10, 20).
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(12, 10, 50)).
				withGlobalUsage(genAPIQuota(2, 3, 5)).
				withCalculatedQuota(genAPIQuota(6, 9, 45)).
				build(),
		},
		{
			Name:      "should process vmclouddirector request successfully",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("12", "10G", "30G").
					withGlobalUsage("2", "3G", "5G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withVMDirector(2, 3000, 10).
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(12, 10, 30)).
				withGlobalUsage(genAPIQuota(2, 3, 5)).
				withCalculatedQuota(genAPIQuota(6, 9, 25)).
				build(),
		},
		{
			Name:      "should process vsphere request successfully",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("12", "10G", "30G").
					withGlobalUsage("2", "3G", "5G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withVsphere(2, 3000, 10).
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(12, 10, 30)).
				withGlobalUsage(genAPIQuota(2, 3, 5)).
				withCalculatedQuota(genAPIQuota(6, 9, 25)).
				build(),
		},
		{
			Name:      "should process nutanix request successfully with no disk set",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("12", "10G", "30G").
					withGlobalUsage("2", "3G", "5G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withNutanix(2, 3000, 0, false).
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(12, 10, 30)).
				withGlobalUsage(genAPIQuota(2, 3, 5)).
				withCalculatedQuota(genAPIQuota(6, 9, 5)).
				build(),
		},
		{
			Name:      "should subtract quota of replaced resources",
			ProjectID: test.GenDefaultProject().Name,
			ExistingKubermaticObjects: test.GenDefaultKubermaticObjects(
				newRQBuilder().
					withQuota("20", "20G", "50G").
					withGlobalUsage("4", "8G", "20G").
					build()),
			ExistingAPIUser: test.GenDefaultAPIUser(),
			RequestBody: newCalcReq().
				withReplicas(2).
				withAWS(4, 4).
				withDiskSize(5).
				withReplacedResources(
					newCalcReq().
						withReplicas(1).
						withAWS(2, 3).
						withDiskSize(5),
				).
				encode(t),
			ExpectedHTTPStatusCode: http.StatusOK,
			ExpectedResponse: newRQUpdateCalculationBuilder().
				withQuota(genAPIQuota(20, 20, 50)).
				withGlobalUsage(genAPIQuota(4, 8, 20)).
				withCalculatedQuota(genAPIQuota(10, 13, 25)).
				build(),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			requestURL := fmt.Sprintf("/api/v2/projects/%s/quotacalculation", tc.ProjectID)
			req := httptest.NewRequest(http.MethodPost, requestURL, bytes.NewBuffer(tc.RequestBody))
			resp := httptest.NewRecorder()

			ep, err := test.CreateTestEndpoint(*tc.ExistingAPIUser, nil, tc.ExistingKubermaticObjects, nil, hack.NewTestRouting)
			if err != nil {
				t.Fatalf("failed to create test endpoint: %v", err)
			}
			ep.ServeHTTP(resp, req)

			if resp.Code != tc.ExpectedHTTPStatusCode {
				t.Fatalf("Expected HTTP status code %d, got %d: %s", tc.ExpectedHTTPStatusCode, resp.Code, resp.Body.String())
			}
			// skip the comparison for error codes and when the name is generated
			if resp.Code == http.StatusOK {
				b, err := json.Marshal(tc.ExpectedResponse)
				if err != nil {
					t.Fatalf("failed to marshal expected response %v", err)
				}
				test.CompareWithResult(t, resp, string(b))
			}
		})
	}
}

type calcReq struct {
	Replicas          int                              `json:"replicas"`
	ReplacedResources *resourcequota.ReplacedResources `json:"ReplacedResources,omitempty"`
	resourcequota.ProviderNodeTemplate
}

func newCalcReq() *calcReq {
	return &calcReq{}
}

func (c *calcReq) encode(t *testing.T) []byte {
	body, err := json.Marshal(c)
	if err != nil {
		t.Fatal(err)
	}

	return body
}

func (c *calcReq) withReplicas(replicas int) *calcReq {
	c.Replicas = replicas
	return c
}

func (c *calcReq) withReplacedResources(provider *calcReq) *calcReq {
	c.ReplacedResources = &resourcequota.ReplacedResources{
		Replicas:             provider.Replicas,
		ProviderNodeTemplate: provider.ProviderNodeTemplate,
	}
	return c
}

func (c *calcReq) withDiskSize(disk int) *calcReq {
	c.DiskSizeGB = disk
	return c
}

func (c *calcReq) withAWS(cpu, memory int) *calcReq {
	c.AWSSize = &apiv1.AWSSize{
		VCPUs:  cpu,
		Memory: float32(memory),
	}
	return c
}

func (c *calcReq) withAlibaba(cpu, memory int) *calcReq {
	c.AlibabaInstanceType = &apiv1.AlibabaInstanceType{
		CPUCoreCount: cpu,
		MemorySize:   float64(memory),
	}
	return c
}

func (c *calcReq) withAnexia(cpu int, memory, diskSize int64) *calcReq {
	c.AnexiaNodeSpec = &apiv1.AnexiaNodeSpec{
		CPUs:   cpu,
		Memory: memory,
		Disks:  []apiv1.AnexiaDiskConfig{{Size: diskSize}},
		// needed for json encoding
		VlanID:     "2",
		TemplateID: "5",
	}
	return c
}

func (c *calcReq) withAzure(cpu, memory, storage int32) *calcReq {
	c.AzureSize = &apiv1.AzureSize{
		NumberOfCores:        cpu,
		MemoryInMB:           memory,
		ResourceDiskSizeInMB: storage,
	}
	return c
}

func (c *calcReq) withDO(cpu, memory, storage int) *calcReq {
	c.DOSize = &apiv1.DigitaloceanSize{
		VCPUs:  cpu,
		Memory: memory,
		Disk:   storage,
	}
	return c
}

func (c *calcReq) withGCP(cpu, memory int64) *calcReq {
	c.GCPSize = &apiv1.GCPMachineSize{
		VCPUs:  cpu,
		Memory: memory,
	}
	return c
}

func (c *calcReq) withHetzner(cpu, memory, storage int) *calcReq {
	c.HetznerSize = &apiv1.HetznerSize{
		Cores:  cpu,
		Memory: float32(memory),
		Disk:   storage,
	}
	return c
}

func (c *calcReq) withKubevirt(cpu, memory, primaryStorage, secondaryStorage string) *calcReq {
	c.KubevirtNodeSize = &apiv1.KubevirtNodeSize{
		CPUs:            cpu,
		Memory:          memory,
		PrimaryDiskSize: primaryStorage,
		SecondaryDisks: []apiv1.SecondaryDisks{
			{Size: secondaryStorage},
		},
	}
	return c
}

func (c *calcReq) withNutanix(cpu, memory, storage int64, withDisk bool) *calcReq {
	c.NutanixNodeSpec = &apiv1.NutanixNodeSpec{
		CPUs:     cpu,
		CPUCores: ptr.To[int64](1),
		MemoryMB: memory,
	}

	if withDisk {
		c.NutanixNodeSpec.DiskSize = ptr.To[int64](storage)
	}

	return c
}

func (c *calcReq) withOpenstack(cpu, memory, storage int, customDisk int) *calcReq {
	c.OpenstackSize = &apiv1.OpenstackSize{
		VCPUs:  cpu,
		Memory: memory,
		Disk:   storage,
	}
	if customDisk != 0 {
		c.DiskSizeGB = customDisk
	}
	return c
}

func (c *calcReq) withVMDirector(cpu, memory, storage int) *calcReq {
	c.VMDirectorNodeSpec = &apiv1.VMwareCloudDirectorNodeSpec{
		CPUCores:   1,
		CPUs:       cpu,
		MemoryMB:   memory,
		DiskSizeGB: ptr.To[int64](int64(storage)),
		// needed for json encoding
		Template: "t",
		Catalog:  "c",
	}
	return c
}

func (c *calcReq) withVsphere(cpu, memory, storage int) *calcReq {
	c.VSphereNodeSpec = &apiv1.VSphereNodeSpec{
		CPUs:       cpu,
		Memory:     memory,
		DiskSizeGB: ptr.To[int64](int64(storage)),
		// needed for json encoding
		Template: "t",
	}
	return c
}

func genQuota(cpu resource.Quantity, mem resource.Quantity, storage resource.Quantity) kubermaticv1.ResourceDetails {
	return kubermaticv1.ResourceDetails{
		CPU:     &cpu,
		Memory:  &mem,
		Storage: &storage,
	}
}

func genAPIQuota(cpu int64, mem, storage float64) apiv2.Quota {
	quota := apiv2.Quota{
		CPU: &cpu,
	}
	if mem != 0 {
		quota.Memory = &mem
	}
	if storage != 0 {
		quota.Storage = &storage
	}
	return quota
}

type rqBuilder struct {
	resourceQuota *kubermaticv1.ResourceQuota
}

func (r *rqBuilder) build() *kubermaticv1.ResourceQuota {
	return r.resourceQuota
}

func newRQBuilder() *rqBuilder {
	return &rqBuilder{resourceQuota: genDefaultResourceQuota()}
}

func (r *rqBuilder) withQuota(cpu, mem, storage string) *rqBuilder {
	r.resourceQuota.Spec.Quota = genQuota(resource.MustParse(cpu), resource.MustParse(mem), resource.MustParse(storage))
	return r
}

func (r *rqBuilder) withGlobalUsage(cpu, mem, storage string) *rqBuilder {
	r.resourceQuota.Status.GlobalUsage = genQuota(resource.MustParse(cpu), resource.MustParse(mem), resource.MustParse(storage))
	return r
}

func genDefaultResourceQuota() *kubermaticv1.ResourceQuota {
	return &kubermaticv1.ResourceQuota{
		ObjectMeta: metav1.ObjectMeta{
			Name: fmt.Sprintf("project-%s", projectName),
			Labels: map[string]string{
				kubermaticv1.ResourceQuotaSubjectKindLabelKey: kubermaticv1.ProjectSubjectKind,
				kubermaticv1.ResourceQuotaSubjectNameLabelKey: projectName,
			},
		},
		Spec: kubermaticv1.ResourceQuotaSpec{
			Subject: kubermaticv1.Subject{
				Name: projectName,
				Kind: kubermaticv1.ProjectSubjectKind,
			},
			Quota: genQuota(resource.MustParse("5"), resource.MustParse("10G"), resource.MustParse("20Gi")),
		},
		Status: kubermaticv1.ResourceQuotaStatus{
			GlobalUsage: genQuota(resource.MustParse("3"), resource.MustParse("2000M"), resource.MustParse("10G")),
		},
	}
}

type rqUpdateCalculationBuilder struct {
	cr apiv2.ResourceQuotaUpdateCalculation
}

func newRQUpdateCalculationBuilder() *rqUpdateCalculationBuilder {
	return &rqUpdateCalculationBuilder{
		cr: apiv2.ResourceQuotaUpdateCalculation{
			ResourceQuota: apiv2.ResourceQuota{
				Name:                     fmt.Sprintf("project-%s", projectName),
				SubjectName:              projectName,
				SubjectKind:              kubermaticv1.ProjectSubjectKind,
				SubjectHumanReadableName: "my-first-project",
			},
		},
	}
}

func (r *rqUpdateCalculationBuilder) withQuota(quota apiv2.Quota) *rqUpdateCalculationBuilder {
	r.cr.ResourceQuota.Quota = quota
	return r
}

func (r *rqUpdateCalculationBuilder) withGlobalUsage(usage apiv2.Quota) *rqUpdateCalculationBuilder {
	r.cr.ResourceQuota.Status.GlobalUsage = usage
	return r
}

func (r *rqUpdateCalculationBuilder) withCalculatedQuota(calc apiv2.Quota) *rqUpdateCalculationBuilder {
	r.cr.CalculatedQuota = calc
	return r
}

func (r *rqUpdateCalculationBuilder) withMessage(msg string) *rqUpdateCalculationBuilder {
	r.cr.Message = msg
	return r
}

func (r *rqUpdateCalculationBuilder) build() *apiv2.ResourceQuotaUpdateCalculation {
	return &r.cr
}
