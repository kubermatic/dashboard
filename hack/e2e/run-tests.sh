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
export CYPRESS_ANEXIA_TEMPLATE_ID="${ANEXIA_TEMPLATE_ID}"
export CYPRESS_ANEXIA_VLAN_ID="${ANEXIA_VLAN_ID}"

source hack/e2e/setup-kind-cluster.sh
source hack/e2e/setup-kubermatic-in-kind.sh

export WAIT_ON_TIMEOUT=600000

set +e
npm run e2e:local
exitcode=$?

if [ -d cypress/videos ] || [ -d cypress/screenshots ]; then
  echodate "Uploading videos / screenshots..."

  MINIO_PUBLIC_ADDRESS="${MINIO_PUBLIC_ADDRESS:-https://minio.ci.kubermatic.io}"

  mc config host add minio "$MINIO_ADDRESS" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY"
  bucketPath="dashboard-cypress-artifacts/pr-$PULL_NUMBER-$JOB_NAME-$BUILD_ID"

  function uploadDirectory() {
    if [ -d "cypress/$1" ]; then
      mc mirror --quiet "cypress/$1" "minio/$bucketPath/$1"
    fi
  }

  function printLinks() {
    if [ -d "cypress/$1" ]; then
      cd "cypress/$1"
      find * -type f -print0 | sort | while IFS= read -r -d '' line; do
        # this urlencoding needs to ensure that slashes are _not_
        # encoded, or else the directory structure breaks
        file="$(python -c "import urllib; print urllib.quote('''$line''')")"
        echodate "$MINIO_PUBLIC_ADDRESS/$bucketPath/$1/$file"
      done
      # do not print the directory name
      cd - > /dev/null
    fi
  }

  uploadDirectory screenshots
  uploadDirectory videos

  echo
  echodate "Artifacts have been uploaded to Minio and can be accessed using the following links:"
  echo

  printLinks screenshots
  printLinks videos
fi

exit $exitcode
