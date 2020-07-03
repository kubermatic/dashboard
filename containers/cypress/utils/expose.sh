#!/usr/bin/env bash
# Copyright 2020 The Kubermatic Kubernetes Platform contributors.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#     http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

export KUBECONFIG=~/.kube/config

# Expose dex to localhost
kubectl port-forward --address 0.0.0.0 -n oauth svc/dex 5556 > /dev/null 2> /dev/null &

# Expose kubermatic API to localhost
kubectl port-forward --address 0.0.0.0 -n kubermatic svc/kubermatic-api 8080:80 > /dev/null 2> /dev/null &
