/*
Copyright 2022 The Kubermatic Kubernetes Platform contributors.

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

package vsphere

import (
	"context"
	"fmt"

	"github.com/vmware/govmomi/vapi/rest"

	utilruntime "k8s.io/apimachinery/pkg/util/runtime"
)

type RESTSession struct {
	Client *rest.Client
}

// Logout closes the idling vCenter connections.
func (s *RESTSession) Logout(ctx context.Context) {
	if err := s.Client.Logout(ctx); err != nil {
		utilruntime.HandleError(fmt.Errorf("vsphere REST client failed to logout: %w", err))
	}
}
