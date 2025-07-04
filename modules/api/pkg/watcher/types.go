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

package watcher

import (
	"code.cloudfoundry.org/go-pubsub"

	"k8c.io/dashboard/v2/pkg/provider"
)

type Providers struct {
	SettingsProvider          provider.SettingsProvider
	SettingsWatcher           SettingsWatcher
	UserProvider              provider.UserProvider
	UserWatcher               UserWatcher
	MemberMapper              provider.ProjectMemberMapper
	ProjectProvider           provider.ProjectProvider
	PrivilegedProjectProvider provider.PrivilegedProjectProvider
	UserInfoGetter            provider.UserInfoGetter
	SeedsGetter               provider.SeedsGetter
	SeedClientGetter          provider.SeedClientGetter
	ClusterProviderGetter     provider.ClusterProviderGetter
}

type SettingsWatcher interface {
	Subscribe(subscription pubsub.Subscription) pubsub.Unsubscriber
}

type UserWatcher interface {
	Subscribe(subscription pubsub.Subscription, opts ...pubsub.SubscribeOption) pubsub.Unsubscriber
	CalculateHash(id string) (uint64, error)
}
