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
	"testing"

	"code.cloudfoundry.org/go-pubsub"
	"go.uber.org/zap"
)

func TestNewUserWatcher(t *testing.T) {
	userWatcher, err := NewUserWatcher(context.Background(), zap.NewNop().Sugar())
	if err != nil {
		t.Fatal("cannot create user watcher")
	}

	counter := 0
	userWatcher.Subscribe(func(d interface{}) {
		counter++
	}, pubsub.WithPath([]uint64{'a'}))

	if counter != 0 {
		t.Fatal("counter should be set to 0 before any data is published")
	}

	userWatcher.publisher.Publish("test-data", pubsub.LinearTreeTraverser([]uint64{'a'}))

	if counter != 1 {
		t.Fatal("counter should be set to 1 after the data is published")
	}

	var data interface{}
	userWatcher.Subscribe(func(d interface{}) {
		data = d
	}, pubsub.WithPath([]uint64{'b'}))

	userWatcher.publisher.Publish("test-data-1", pubsub.LinearTreeTraverser([]uint64{'b'}))

	if data != "test-data-1" {
		t.Fatal("data should be correctly read in the subscription")
	}

	if counter != 1 {
		t.Fatal("counter should be set to 1 after the data is published to `b` subscriber")
	}
}
