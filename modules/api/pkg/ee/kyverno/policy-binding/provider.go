package policybinding

import (
	"context"
	"fmt"

	"k8c.io/dashboard/v2/pkg/provider"
	"k8c.io/dashboard/v2/pkg/provider/kubernetes"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"
	restclient "k8s.io/client-go/rest"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

type PolicyBindingProvider struct {
	createMasterImpersonatedClient kubernetes.ImpersonationClient
	privilegedClient               ctrlruntimeclient.Client
}

func NewPolicyBindingProvider(createMasterImpersonatedClient kubernetes.ImpersonationClient, privilegedClient ctrlruntimeclient.Client) *PolicyBindingProvider {
	return &PolicyBindingProvider{
		createMasterImpersonatedClient: createMasterImpersonatedClient,
		privilegedClient:               privilegedClient,
	}
}

func (p *PolicyBindingProvider) Create(ctx context.Context, policyBinding *kubermaticv1.PolicyBinding) (*kubermaticv1.PolicyBinding, error) {
	client := p.privilegedClient

	if err := client.Create(ctx, policyBinding); err != nil {
		return nil, err
	}

	return policyBinding, nil
}

func (p *PolicyBindingProvider) List(ctx context.Context) (*kubermaticv1.PolicyBindingList, error) {
	client := p.privilegedClient

	policyBindingList := &kubermaticv1.PolicyBindingList{}
	if err := client.List(ctx, policyBindingList); err != nil {
		return nil, err
	}
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	fmt.Println("policyBindingList:", policyBindingList)
	fmt.Println("==============================================")
	fmt.Println("==============================================")

	return policyBindingList, nil
}

func (p *PolicyBindingProvider) Get(ctx context.Context, policyBindingName string, userInfo *provider.UserInfo) (*kubermaticv1.PolicyBinding, error) {
	client := p.privilegedClient

	policyBinding := &kubermaticv1.PolicyBinding{}
	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{Name: policyBindingName}, policyBinding); err != nil {
		return nil, err
	}
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	fmt.Println("policyBinding:", policyBinding)
	fmt.Println("==============================================")
	fmt.Println("==============================================")
	return policyBinding, nil
}

func (p *PolicyBindingProvider) Patch(ctx context.Context, updatedPolicyBinding *kubermaticv1.PolicyBinding) (*kubermaticv1.PolicyBinding, error) {
	client := p.privilegedClient

	existing := &kubermaticv1.PolicyBinding{}

	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{Name: updatedPolicyBinding.Name}, existing); err != nil {
		return nil, err
	}

	updated := existing.DeepCopy()
	updated.Spec = updatedPolicyBinding.Spec

	if err := client.Patch(ctx, updated, ctrlruntimeclient.MergeFrom(existing)); err != nil {
		return nil, err
	}

	return updated, nil
}

func (p *PolicyBindingProvider) Delete(ctx context.Context, policyTemplateName string) error {
	client := p.privilegedClient

	policyBinding := &kubermaticv1.PolicyBinding{}
	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{Name: policyTemplateName}, policyBinding); err != nil {
		return err
	}

	if err := client.Delete(ctx, policyBinding); err != nil {
		return err
	}

	return nil
}

func (p *PolicyBindingProvider) getImpersonatedClient(userInfo *provider.UserInfo) (ctrlruntimeclient.Client, error) {
	impersonationCfg := restclient.ImpersonationConfig{
		UserName: userInfo.Email,
		Groups:   userInfo.Groups,
	}
	return p.createMasterImpersonatedClient(impersonationCfg)
}
