#!/usr/bin/env bash

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
