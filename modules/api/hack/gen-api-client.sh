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

### Generates the KKP API Swagger spec and client. The generated client is then
### used in the api-e2e tests and published into https://github.com/kubermatic/go-kubermatic

set -euo pipefail

cd $(dirname $0)/../../..
source hack/lib.sh

API=modules/api

CONTAINERIZE_IMAGE=quay.io/kubermatic/build:go-1.23-node-20-14 containerize ./modules/api/hack/gen-api-client.sh

cd $API/cmd/kubermatic-api/
SWAGGER_FILE="swagger.json"
TMP_SWAGGER="${SWAGGER_FILE}.tmp"

function cleanup() {
  rm $TMP_SWAGGER
}
trap cleanup EXIT SIGINT SIGTERM

# We had to exclude "github.com/sigstore/rekor/pkg/generated/models" package because swagger spec generation was failing with the error:
# classifier: unknown swagger annotation "discriminator"

# Kyverno causes conflicts with Kubernetes Admission APIs and thus resulting in inconsistent swagger spec generation on each run. Ignoring Kyverno APIs is not possible
# as it would break the generation of the Kyverno API client. So instead we are excluding the conflicting APIs/models "k8s.io/api/admissionregistration".
run_swagger generate spec \
  --tags=ee \
  --scan-models \
  -o ${TMP_SWAGGER} \
  -x github.com/sigstore/rekor/pkg/generated/models \
  -x k8s.io/api/admissionregistration/* \
  -x k8c.io/kubermatic/*

rm -r ../../pkg/test/e2e/utils/apiclient/
mkdir -p ../../pkg/test/e2e/utils/apiclient/

run_swagger generate client \
  -q \
  --skip-validation \
  -f ${TMP_SWAGGER} \
  -t ../../pkg/test/e2e/utils/apiclient/
