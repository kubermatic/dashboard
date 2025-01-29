//go:build ee

/*
                  Kubermatic Enterprise Read-Only License
                         Version 1.0 ("KERO-1.0”)
                     Copyright © 2025 Kubermatic GmbH

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

package policytemplate

import (
	"context"
	"fmt"

	// apiv2 "k8c.io/dashboard/v2/pkg/api/v2"
	"k8c.io/dashboard/v2/pkg/provider"
	"k8c.io/dashboard/v2/pkg/provider/kubernetes"

	// "k8c.io/dashboard/v2/pkg/test/e2e/utils/apiclient/client"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"

	restclient "k8s.io/client-go/rest"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

type PolicyTemplateProvider struct {
	createMasterImpersonatedClient kubernetes.ImpersonationClient
	privilegedClient               ctrlruntimeclient.Client
}

func NewPolicyTemplateProvider(createMasterImpersonatedClient kubernetes.ImpersonationClient, privilegedClient ctrlruntimeclient.Client) *PolicyTemplateProvider {
	return &PolicyTemplateProvider{
		createMasterImpersonatedClient: createMasterImpersonatedClient,
		privilegedClient:               privilegedClient,
	}
}

func (p *PolicyTemplateProvider) Create(ctx context.Context, policyTemplate *kubermaticv1.PolicyTemplate) (*kubermaticv1.PolicyTemplate, error) {
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	fmt.Println("policyTemplate")
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	client := p.privilegedClient

	if err := client.Create(ctx, policyTemplate); err != nil {
		return nil, err
	}

	return policyTemplate, nil
}

func (p *PolicyTemplateProvider) List(ctx context.Context) (*kubermaticv1.PolicyTemplateList, error) {
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	fmt.Println("LIST")
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	client := p.privilegedClient

	policyTemplateList := &kubermaticv1.PolicyTemplateList{}
	if err := client.List(ctx, policyTemplateList); err != nil {
		return nil, err
	}

	return policyTemplateList, nil
}

func (p *PolicyTemplateProvider) Get(ctx context.Context, policyTemplateName string) (*kubermaticv1.PolicyTemplate, error) {
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	fmt.Println("GETpolicyTemplateName")
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	client := p.privilegedClient

	policyTemplate := &kubermaticv1.PolicyTemplate{}
	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{Name: policyTemplateName}, policyTemplate); err != nil {
		return nil, err
	}

	return policyTemplate, nil
}

func (p *PolicyTemplateProvider) Patch(ctx context.Context, updatedpolicyTemplate *kubermaticv1.PolicyTemplate) (*kubermaticv1.PolicyTemplate, error) {
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	fmt.Println("Patch")
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	client := p.privilegedClient

	existing := &kubermaticv1.PolicyTemplate{}

	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{Name: updatedpolicyTemplate.Name}, existing); err != nil {
		return nil, err
	}

	if err := client.Patch(ctx, updatedpolicyTemplate, ctrlruntimeclient.MergeFrom(existing)); err != nil {
		return nil, err
	}

	return updatedpolicyTemplate, nil
}

func (p *PolicyTemplateProvider) Delete(ctx context.Context, policyTemplateName string) error {
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	fmt.Println("Delete")
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	client := p.privilegedClient

	policyTemplate := &kubermaticv1.PolicyTemplate{}
	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{Name: policyTemplateName}, policyTemplate); err != nil {
		return err
	}

	if err := client.Delete(ctx, policyTemplate); err != nil {
		return err
	}

	return nil
}

func (p *PolicyTemplateProvider) getImpersonatedClient(userInfo *provider.UserInfo) (ctrlruntimeclient.Client, error) {
	impersonationCfg := restclient.ImpersonationConfig{
		UserName: userInfo.Email,
		Groups:   userInfo.Groups,
	}
	return p.createMasterImpersonatedClient(impersonationCfg)
}
