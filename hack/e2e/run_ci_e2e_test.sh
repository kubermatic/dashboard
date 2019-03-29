#!/usr/bin/env bash

set -euo pipefail

CONTROLLER_IMAGE="quay.io/kubermatic/cluster-exposer:v1.0.0"

if [[ -z ${JOB_NAME} ]]; then
	echo "This script should only be running in a CI environment."
	exit 0
fi

if [[ -z ${PROW_JOB_ID} ]]; then
	echo "Build id env variable has to be set."
	exit 0
fi

export KUBERMATIC_DEX_DEV_E2E_USERNAME="roxy@loodse.com"
export KUBERMATIC_DEX_DEV_E2E_PASSWORD="password"

function cleanup {
	kubectl delete service -l "prow.k8s.io/id=$PROW_JOB_ID"

	# Kill all descendant processes
	pkill -P $$
}
trap cleanup EXIT

# Set docker config
echo $IMAGE_PULL_SECRET_DATA | base64 -d > /config.json

sed 's/localhost/localhost dex.oauth/' < /etc/hosts > /hosts
cat /hosts > /etc/hosts

# Start docker daemon
dockerd > /dev/null 2> /dev/null &

OLD_DIR=$(pwd)
cd hack/e2e

./deploy.sh
DOCKER_CONFIG=/ docker run --name controller -d -v /root/.kube/config:/inner -v /etc/kubeconfig/kubeconfig:/outer --network host --privileged ${CONTROLLER_IMAGE} --kubeconfig-inner "/inner" --kubeconfig-outer "/outer" --namespace "default" --build-id "$PROW_JOB_ID"
docker logs -f controller &

./expose.sh

cd ${OLD_DIR}

npm run versioninfo
npm run e2e:local --oauth=http://dex.oauth:5556/auth