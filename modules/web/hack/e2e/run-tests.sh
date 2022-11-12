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

set -euo pipefail

echodate() {
  # do not use -Is to keep this compatible with macOS
  echo "[$(date +%Y-%m-%dT%H:%M:%S%:z)]" "$@"
}

if [ -z "${JOB_NAME:-}" ] || [ -z "${PROW_JOB_ID:-}" ]; then
  echodate "This script should only be running in a CI environment."
  exit 1
fi

echodate "NPM version: $(npm -v)"
echodate "Node version: $(node -v)"

export KUBERMATIC_EDITION="${KUBERMATIC_EDITION:-ee}"
export CYPRESS_MOCKS=${CYPRESS_MOCKS:-"false"}

if [ $CYPRESS_MOCKS != "true" ]; then
  export SEED_NAME="kubermatic"
  export KIND_CLUSTER_NAME="${SEED_NAME}"

  source "${GOPATH}/src/github.com/kubermatic/kubermatic/hack/lib.sh"
  source ../../hack/e2e/setup-kind-cluster.sh
  source ../../hack/e2e/setup-kubermatic-in-kind.sh

  export CYPRESS_SEED_NAME="${SEED_NAME}"
  export CYPRESS_KUBECONFIG_ENCODED="$(kind get kubeconfig --name="$KIND_CLUSTER_NAME" --internal | base64 -w0)"
  export CYPRESS_USERNAME="roxy@kubermatic.com"
  export CYPRESS_USERNAME_2="roxy2@kubermatic.com"
  export CYPRESS_PASSWORD="password"
fi

export CYPRESS_KUBERMATIC_EDITION="${KUBERMATIC_EDITION}"
export CYPRESS_RECORD_KEY=7859bcb8-1d2a-4d56-b7f5-ca70b93f944c
export WAIT_ON_TIMEOUT=600000

set +e
npx cypress verify || true
if [ $CYPRESS_MOCKS != "true" ]; then
  npm run e2e:local
else
  npm run e2e:mock
fi

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
