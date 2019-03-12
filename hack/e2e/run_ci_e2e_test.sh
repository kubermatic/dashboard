#!/usr/bin/env bash

set -euo pipefail

CLUSTER_EXPOSER_DIR=${GOPATH}/src/github.com/kubermatic/cluster-exposer
CLUSTER_EXPOSER_BIN=${CLUSTER_EXPOSER_DIR}/build/cluster-exposer

# TODO: Remove when updating infra
export KUBERMATIC_DEX_DEV_E2E_USERNAME=${KUBERMATIC_DEX_DEV_E2E_USERNAME:="roxy@loodse.com"}
export KUBERMATIC_DEX_DEV_E2E_PASSWORD=${KUBERMATIC_DEX_DEV_E2E_PASSWORD:="password"}

if [[ -z ${JOB_NAME} ]]; then
	echo "This script should only be running in a CI environment."
	exit 0
fi

if [[ -z ${PROW_JOB_ID} ]]; then
	echo "Build id env variable has to be set."
	exit 0
fi

function cleanup {
	kubectl delete service -l "prow.k8s.io/id=$PROW_JOB_ID"

	# Kill all descendant processes
	pkill -P $$
}
trap cleanup EXIT

sed 's/localhost/localhost dex.oauth/' < /etc/hosts > /hosts
cat /hosts > /etc/hosts

# Start docker daemon
dockerd > /dev/null 2> /dev/null &

OLD_DIR=$(pwd)
cd hack/e2e

make -C ${CLUSTER_EXPOSER_DIR}

./deploy.sh

${CLUSTER_EXPOSER_BIN} --kubeconfig-inner "/root/.kube/config" --kubeconfig-outer "/etc/kubeconfig/kubeconfig" --namespace "default" --build-id "$PROW_JOB_ID" &

./expose.sh

cd ${OLD_DIR}

npm run versioninfo
npm run e2e:local --oauth=http://dex.oauth:5556/auth