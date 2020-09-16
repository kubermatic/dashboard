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

set -eo pipefail

shopt -s nocasematch
if [[ ${KUBERMATIC_EDITION} = ce ]]; then
  export CYPRESS_KUBERMATIC_EDITION=ce
else
  export CYPRESS_KUBERMATIC_EDITION=ee
fi

export CYPRESS_KUBERMATIC_DEX_DEV_E2E_USERNAME="roxy@loodse.com"
export CYPRESS_KUBERMATIC_DEX_DEV_E2E_USERNAME_2="roxy2@loodse.com"
export CYPRESS_KUBERMATIC_DEX_DEV_E2E_PASSWORD="password"
export CYPRESS_RECORD_KEY=7859bcb8-1d2a-4d56-b7f5-ca70b93f944c

apt install -y gettext bash-completion

source hack/e2e/ci-setup-kubermatic-in-kind.sh

WAIT_ON_TIMEOUT=600000 npm run e2e:local
