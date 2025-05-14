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
