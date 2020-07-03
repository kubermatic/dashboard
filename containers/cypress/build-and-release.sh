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

set -e

IMG_REPO="quay.io/kubermatic"
IMG_NAME="e2e-kind-cypress"
IMG_VERSION="v1.1.1"

# Preloaded images
IMG_KIND="kindest/node:v1.15.6"
IMG_KIND_NAME="kindest.tar"

docker pull ${IMG_KIND}
docker save -o ${IMG_KIND_NAME} ${IMG_KIND}
docker build -t ${IMG_REPO}/${IMG_NAME}:${IMG_VERSION} .
docker push ${IMG_REPO}/${IMG_NAME}:${IMG_VERSION}

rm ${IMG_KIND_NAME}
