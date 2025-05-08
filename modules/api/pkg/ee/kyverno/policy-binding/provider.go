package policybinding

import (
	"context"

	"k8c.io/dashboard/v2/pkg/provider"
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

func (p *PolicyBindingProvider) ListUnsecured(ctx context.Context) (*kubermaticv1.PolicyBindingList, error) {
	policyBindingList := &kubermaticv1.PolicyBindingList{}
	if err := p.privilegedClient.List(ctx, policyBindingList); err != nil {
		return nil, err
	}

	return policyBindingList, nil
}

func (p *PolicyBindingProvider) GetUnsecured(ctx context.Context, policyBindingName string, namespace string) (*kubermaticv1.PolicyBinding, error) {
	client := p.privilegedClient.(ctrlruntimeclient.Reader)

	policyBinding := &kubermaticv1.PolicyBinding{}
	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{Namespace: namespace, Name: policyBindingName}, policyBinding); err != nil {
		return nil, err
	}
	return policyBinding, nil
}

func (p *PolicyBindingProvider) PatchUnsecured(ctx context.Context, user *provider.UserInfo, updatedPolicyBinding *kubermaticv1.PolicyBinding, projectID string) (*kubermaticv1.PolicyBinding, error) {
	client := p.privilegedClient

	existing := &kubermaticv1.PolicyBinding{}

	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{Namespace: updatedPolicyBinding.Namespace, Name: updatedPolicyBinding.Name}, existing); err != nil {
		return nil, err
	}

	updated := existing.DeepCopy()
	updated.Spec = updatedPolicyBinding.Spec
	// TODO(@ahmadhamzh): Please fix this
	// if existing.Spec.Target.Projects.SelectAll || slices.Contains(existing.Spec.Target.Projects.Name, projectID) || user.IsAdmin {
	// 	if err := client.Patch(ctx, updated, ctrlruntimeclient.MergeFrom(existing)); err != nil {
	// 		return nil, err
	// 	}
	// } else {
	// 	return nil, fmt.Errorf("user %s is not allowed to update the policy binding %s", user.Email, updated.Name)
	// }

	return updated, nil
}

func (p *PolicyBindingProvider) DeleteUnsecured(ctx context.Context, user *provider.UserInfo, policyTemplateName string, namespace string, projectID string) error {
	client := p.privilegedClient

	existing := &kubermaticv1.PolicyBinding{}
	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{Namespace: namespace, Name: policyTemplateName}, existing); err != nil {
		return err
	}
	// TODO(@ahmadhamzh): Please fix this
	// if existing.Spec.Target.Projects.SelectAll || slices.Contains(existing.Spec.Target.Projects.Name, projectID) || (user.IsAdmin && projectID == "") {
	// 	if err := client.Delete(ctx, existing); err != nil {
	// 		return err
	// 	}
	// } else {
	// 	return fmt.Errorf("user %s is not allowed to delete the policy binding %s", user.Email, policyTemplateName)
	// }

	return nil
}
