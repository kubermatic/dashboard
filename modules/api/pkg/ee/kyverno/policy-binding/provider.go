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

package policybinding

import (
	"context"
	"fmt"

	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

type PolicyBindingProvider struct {
	privilegedClient ctrlruntimeclient.Client
}

func NewPolicyBindingProvider(privilegedClient ctrlruntimeclient.Client) *PolicyBindingProvider {
	return &PolicyBindingProvider{
		privilegedClient: privilegedClient,
	}
}

func (p *PolicyBindingProvider) CreateUnsecured(ctx context.Context, policyBinding *kubermaticv1.PolicyBinding) (*kubermaticv1.PolicyBinding, error) {
	if err := p.privilegedClient.Create(ctx, policyBinding); err != nil {
		return nil, err
	}

	return policyBinding, nil
}

func (p *PolicyBindingProvider) ListUnsecured(ctx context.Context, clusterID string) (*kubermaticv1.PolicyBindingList, error) {
	policyBindingList := &kubermaticv1.PolicyBindingList{}
	namespace := fmt.Sprintf("cluster-%s", clusterID)
	if err := p.privilegedClient.List(ctx, policyBindingList, ctrlruntimeclient.InNamespace(namespace)); err != nil {
		return nil, err
	}

	return policyBindingList, nil
}

func (p *PolicyBindingProvider) GetUnsecured(ctx context.Context, policyBindingName string, clusterID string) (*kubermaticv1.PolicyBinding, error) {
	client := p.privilegedClient.(ctrlruntimeclient.Reader)

	policyBinding := &kubermaticv1.PolicyBinding{}
	namespace := fmt.Sprintf("cluster-%s", clusterID)
	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{Namespace: namespace, Name: policyBindingName}, policyBinding); err != nil {
		return nil, err
	}
	return policyBinding, nil
}

func (p *PolicyBindingProvider) PatchUnsecured(ctx context.Context, updatedPolicyBinding *kubermaticv1.PolicyBinding) (*kubermaticv1.PolicyBinding, error) {
	client := p.privilegedClient

	existing := &kubermaticv1.PolicyBinding{}

	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{Namespace: updatedPolicyBinding.Namespace, Name: updatedPolicyBinding.Name}, existing); err != nil {
		return nil, err
	}

	updated := existing.DeepCopy()
	updated.Spec = updatedPolicyBinding.Spec

	if err := client.Patch(ctx, updated, ctrlruntimeclient.MergeFrom(existing)); err != nil {
		return nil, err
	}

	return updated, nil
}

func (p *PolicyBindingProvider) DeleteUnsecured(ctx context.Context, policyTemplateName string, clusterID string) error {
	client := p.privilegedClient

	existing := &kubermaticv1.PolicyBinding{}
	namespace := fmt.Sprintf("cluster-%s", clusterID)
	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{Namespace: namespace, Name: policyTemplateName}, existing); err != nil {
		return err
	}

	if err := client.Delete(ctx, existing); err != nil {
		return err
	}

	return nil
}
