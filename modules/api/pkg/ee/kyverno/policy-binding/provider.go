package policybinding

import (
	"context"
	"fmt"
	"slices"

	"k8c.io/dashboard/v2/pkg/provider"
	"k8c.io/dashboard/v2/pkg/provider/kubernetes"
	kubermaticv1 "k8c.io/kubermatic/v2/pkg/apis/kubermatic/v1"

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

	return policyBindingList, nil
}

func (p *PolicyBindingProvider) Get(ctx context.Context, policyBindingName string, namespace string) (*kubermaticv1.PolicyBinding, error) {
	client := p.privilegedClient.(ctrlruntimeclient.Reader)

	policyBinding := &kubermaticv1.PolicyBinding{}
	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{Namespace: namespace, Name: policyBindingName}, policyBinding); err != nil {
		return nil, err
	}
	return policyBinding, nil
}

func (p *PolicyBindingProvider) Patch(ctx context.Context, user *provider.UserInfo, updatedPolicyBinding *kubermaticv1.PolicyBinding, projectID string) (*kubermaticv1.PolicyBinding, error) {
	client := p.privilegedClient

	existing := &kubermaticv1.PolicyBinding{}

	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{Namespace: updatedPolicyBinding.Namespace, Name: updatedPolicyBinding.Name}, existing); err != nil {
		return nil, err
	}

	updated := existing.DeepCopy()
	updated.Spec = updatedPolicyBinding.Spec
	if existing.Spec.Target.Projects.SelectAll || slices.Contains(existing.Spec.Target.Projects.Name, projectID) || user.IsAdmin {
		if err := client.Patch(ctx, updated, ctrlruntimeclient.MergeFrom(existing)); err != nil {
			return nil, err
		}
	} else {
		return nil, fmt.Errorf("user %s is not allowed to update the policy binding %s", user.Email, updated.Name)
	}

	return updated, nil
}

func (p *PolicyBindingProvider) Delete(ctx context.Context, user *provider.UserInfo, policyTemplateName string, namespace string, projectID string) error {
	client := p.privilegedClient

	existing := &kubermaticv1.PolicyBinding{}
	if err := client.Get(ctx, ctrlruntimeclient.ObjectKey{Namespace: namespace, Name: policyTemplateName}, existing); err != nil {
		return err
	}
	if existing.Spec.Target.Projects.SelectAll || slices.Contains(existing.Spec.Target.Projects.Name, projectID) || (user.IsAdmin && projectID == "") {
		if err := client.Delete(ctx, existing); err != nil {
			return err
		}
	} else {
		return fmt.Errorf("user %s is not allowed to delete the policy binding %s", user.Email, policyTemplateName)
	}

	return nil
}
