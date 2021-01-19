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

set -euo pipefail

source "${GOPATH}/src/github.com/kubermatic/kubermatic/hack/lib.sh"

if [ -z "${JOB_NAME:-}" ] || [ -z "${PROW_JOB_ID:-}" ]; then
  echodate "This script should only be running in a CI environment."
  exit 1
fi

export KUBERMATIC_EDITION="${KUBERMATIC_EDITION:-ee}"
export CYPRESS_KUBERMATIC_EDITION="${KUBERMATIC_EDITION}"
export SEED_NAME="kubermatic"
export KIND_CLUSTER_NAME="${SEED_NAME}"
export CYPRESS_KUBERMATIC_DEX_DEV_E2E_USERNAME="roxy@loodse.com"
export CYPRESS_KUBERMATIC_DEX_DEV_E2E_USERNAME_2="roxy2@loodse.com"
export CYPRESS_KUBERMATIC_DEX_DEV_E2E_PASSWORD="password"
export CYPRESS_RECORD_KEY=7859bcb8-1d2a-4d56-b7f5-ca70b93f944c

apt install -y gettext bash-completion

source hack/e2e/setup-kind-cluster.sh
source hack/e2e/setup-kubermatic-in-kind.sh

WAIT_ON_TIMEOUT=600000 npm run e2e:local
