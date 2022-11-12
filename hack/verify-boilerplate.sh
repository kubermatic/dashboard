#!/usr/bin/env bash

# Copyright 2021 The Kubermatic Kubernetes Platform contributors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -euo pipefail

cd $(dirname $0)/..

echo "Checking Kubermatic CE licenses..."
boilerplate \
  -boilerplates hack/boilerplate/ce \
  -exclude modules/web/src/app/dynamic/enterprise \
  -exclude modules/web/src/index.html \
  -exclude modules/api/pkg/provider/cloud/eks/authenticator \
  -exclude modules/api/pkg/ee

echo "Checking Kubermatic EE licenses..."
boilerplate \
  -boilerplates modules/web/hack/boilerplate/ee \
  modules/web/src/app/dynamic/enterprise \
  modules/api/pkg/ee
