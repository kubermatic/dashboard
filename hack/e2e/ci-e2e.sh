#!/usr/bin/env bash

set -euo pipefail

export CYPRESS_KUBERMATIC_DEX_DEV_E2E_USERNAME="roxy@loodse.com"
export CYPRESS_KUBERMATIC_DEX_DEV_E2E_USERNAME_2="roxy2@loodse.com"
export CYPRESS_KUBERMATIC_DEX_DEV_E2E_PASSWORD="password"

export CYPRESS_RECORD_KEY=7859bcb8-1d2a-4d56-b7f5-ca70b93f944c

export KUBERMATIC_SKIP_BUILDING=true
export KUBERMATIC_VERSION=latest

apt install -y gettext bash-completion

export CACHE_VERSION="$(git -C ../kubermatic rev-parse HEAD)"
source ${GOPATH}/src/github.com/kubermatic/kubermatic/api/hack/ci/ci-setup-kubermatic-in-kind.sh

echodate "Applying presets..."
retry 2 kubectl apply -f $(dirname $0)/fixtures/presets.yaml

echodate "Applying user..."
retry 2 kubectl apply -f $(dirname $0)/fixtures/user.yaml

WAIT_ON_TIMEOUT=600000 npm run e2e:local
