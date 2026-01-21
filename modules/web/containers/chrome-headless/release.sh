#!/usr/bin/env bash

# Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

TAG=v1.9.3

set -euo pipefail

cd $(dirname $0)

# Ensure that you build for linux in apple silicon.
if [[ $(uname -m) == 'arm64' ]]; then
  export DOCKER_DEFAULT_PLATFORM=linux/amd64
fi

docker build --no-cache --pull -t quay.io/kubermatic/chrome-headless:${TAG} .
docker push quay.io/kubermatic/chrome-headless:${TAG}
