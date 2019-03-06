#!/usr/bin/env bash

set -euo pipefail

RUNNING_IN_CI=${JOB_NAME:=""}
KUBECTL_VERSION=$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)

KUBERMATIC_DEX_DEV_E2E_USERNAME=""
KUBERMATIC_DEX_DEV_E2E_PASSWORD=""

if [[ -z ${JOB_NAME} ]]; then
	echo "This script should only be running in a CI environment."
	exit 0
fi

# TODO: Build a cluster-exposer

KUBERMATIC_DOMAIN="ci.kubermatic.io" ./deploy.sh

# TODO: Run a cluster-exposer

./expose.sh

npm run versioninfo
npm run e2e
