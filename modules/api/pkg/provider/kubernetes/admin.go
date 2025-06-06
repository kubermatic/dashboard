/*
Copyright 2020 The Kubermatic Kubernetes Platform contributors.

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

package kubernetes

import (
	"context"
	"fmt"
	"strings"

	apiv1 "k8c.io/dashboard/v2/pkg/api/v1"
	"k8c.io/dashboard/v2/pkg/provider"
	kubermaticv1 "k8c.io/kubermatic/sdk/v2/apis/kubermatic/v1"

	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime/schema"
	ctrlruntimeclient "sigs.k8s.io/controller-runtime/pkg/client"
)

// NewAdminProvider returns a admin provider.
func NewAdminProvider(client ctrlruntimeclient.Client) *AdminProvider {
	return &AdminProvider{
		client: client,
	}
}

// AdminProvider manages admin resources.
type AdminProvider struct {
	client ctrlruntimeclient.Client
}

var _ provider.AdminProvider = &AdminProvider{}

// GetAdmins return all users with admin rights.
func (a *AdminProvider) GetAdmins(ctx context.Context, userInfo *provider.UserInfo) ([]kubermaticv1.User, error) {
	var adminList []kubermaticv1.User
	if !userInfo.IsAdmin {
		return nil, apierrors.NewForbidden(schema.GroupResource{}, userInfo.Email, fmt.Errorf("%q doesn't have admin rights", userInfo.Email))
	}
	users := &kubermaticv1.UserList{}
	if err := a.client.List(ctx, users); err != nil {
		return nil, err
	}

	for _, user := range users.Items {
		if user.Spec.IsAdmin {
			adminList = append(adminList, *user.DeepCopy())
		}
	}

	return adminList, nil
}

// SetAdmin set/clear admin rights.
func (a *AdminProvider) SetAdmin(ctx context.Context, userInfo *provider.UserInfo, adminBody apiv1.Admin) (*kubermaticv1.User, error) {
	if !userInfo.IsAdmin {
		return nil, apierrors.NewForbidden(schema.GroupResource{}, userInfo.Email, fmt.Errorf("%q doesn't have admin rights", userInfo.Email))
	}
	if strings.EqualFold(userInfo.Email, adminBody.Email) {
		return nil, apierrors.NewBadRequest("can not change own privileges")
	}
	userList := &kubermaticv1.UserList{}
	if err := a.client.List(ctx, userList); err != nil {
		return nil, err
	}
	for _, user := range userList.Items {
		if strings.EqualFold(user.Spec.Email, adminBody.Email) {
			userCopy := user.DeepCopy()
			if adminBody.IsAdmin != nil {
				userCopy.Spec.IsAdmin = *adminBody.IsAdmin
			}
			if adminBody.IsGlobalViewer != nil {
				userCopy.Spec.IsGlobalViewer = *adminBody.IsGlobalViewer
			}
			if err := a.client.Update(ctx, userCopy); err != nil {
				return nil, err
			}
			return userCopy, nil
		}
	}
	return nil, fmt.Errorf("the given user %s was not found", adminBody.Email)
}
