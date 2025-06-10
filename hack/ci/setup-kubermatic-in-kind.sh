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

### This script creates a local kind cluster, compiles the KKP binaries,
### creates all Docker images and loads them into the kind cluster,
### then installs KKP using the KKP installer + operator and sets up a
### single shared master/seed system.
### This serves as the precursor for all other tests.
###
### This script should be sourced, not called, so callers get the variables
### it sets.

source hack/lib.sh

if [ -z "${KIND_CLUSTER_NAME:-}" ]; then
  echodate "KIND_CLUSTER_NAME must be set by calling setup-kind-cluster.sh first."
  exit 1
fi

# make sure to mirror the dashboard's branch to the kubermatic branch, so that
# when a release is made and later cherrypicks happen, those jobs will not rely
# on the wrong KKP version
if [[ "${PULL_BASE_REF:-main}" =~ release/v[0-9]+.* ]]; then
  # turn "release/v2.21" into "v2.21-latest"
  KUBERMATIC_VERSION="${PULL_BASE_REF#release/}"
  KUBERMATIC_VERSION="${KUBERMATIC_VERSION//\//-}-latest"
else
  KUBERMATIC_VERSION="$(kubermatic_git_hash)"
fi

export DASHBOARD_VERSION="${DASHBOARD_VERSION:-$(git rev-parse HEAD)}"
KUBERMATIC_OSM_ENABLED="${KUBERMATIC_OSM_ENABLED:-true}"

echodate "KKP Docker image tag: $KUBERMATIC_VERSION"
echodate "Dashboard version...: $DASHBOARD_VERSION"

REPOSUFFIX=""
if [ "$KUBERMATIC_EDITION" != "ce" ]; then
  REPOSUFFIX="-$KUBERMATIC_EDITION"
fi

# This is just used as a const
# NB: The CE requires Seeds to be named this way
export SEED_NAME=kubermatic
export KUBERMATIC_YAML="${KUBERMATIC_YAML:-hack/ci/testdata/kubermatic.yaml}"

# This defines the Kubermatic API endpoint the e2e tests will communicate with.
# The api service is kubectl-proxied later on.
export KUBERMATIC_API_ENDPOINT="http://localhost:8080"

# Tell the Go tests what dummy account we configure for the e2e tests.
export KUBERMATIC_DEX_VALUES_FILE=$(realpath hack/ci/testdata/dex_values.yaml)
export KUBERMATIC_OIDC_LOGIN="roxy@kubermatic.com"
export KUBERMATIC_OIDC_PASSWORD="password"

# Set docker config
echo "$IMAGE_PULL_SECRET_DATA" | base64 -d > /config.json

# The alias makes it easier to access the port-forwarded Dex inside the Kind cluster;
# the token issuer cannot be localhost:5556, because pods inside the cluster would not
# find Dex anymore. As this script can be run multiple times in the same CI job,
# we must make sure to only add the alias once.
if ! grep oauth /etc/hosts > /dev/null; then
  echodate "Setting dex.oauth alias in /etc/hosts"
  # The container runtime allows us to change the content but not to change the inode
  # which is what sed -i does, so write to a tempfile and write the tempfiles content back.
  temp_hosts="$(mktemp)"
  sed 's/localhost/localhost dex.oauth/' /etc/hosts > $temp_hosts
  cat $temp_hosts > /etc/hosts
  echodate "Set dex.oauth alias in /etc/hosts"
fi

# Build binaries and load the Docker images into the kind cluster.
echodate "Building static files for $DASHBOARD_VERSION"
time retry 1 make web-dist

echodate "Building binaries for $DASHBOARD_VERSION"
TEST_NAME="Build API binaries"

beforeGoBuild=$(nowms)
time retry 1 make build
pushElapsed kubermatic_go_build_duration_milliseconds $beforeGoBuild

IMAGE_NAME="quay.io/kubermatic/dashboard$REPOSUFFIX:$DASHBOARD_VERSION"

(
  echodate "Building Kubermatic API Docker image"
  TEST_NAME="Build Kubermatic API Docker image"
  time retry 5 docker build -t "$IMAGE_NAME" .
  time retry 5 kind load docker-image "$IMAGE_NAME" --name "$KIND_CLUSTER_NAME"
)

# prepare to run kubermatic-installer
KUBERMATIC_CONFIG="$(mktemp)"
IMAGE_PULL_SECRET_INLINE="$(echo "$IMAGE_PULL_SECRET_DATA" | base64 --decode | jq --compact-output --monochrome-output '.')"
KUBERMATIC_DOMAIN="${KUBERMATIC_DOMAIN:-ci.kubermatic.io}"

cp $KUBERMATIC_YAML $KUBERMATIC_CONFIG

sed -i "s;__SERVICE_ACCOUNT_KEY__;$SERVICE_ACCOUNT_KEY;g" $KUBERMATIC_CONFIG
sed -i "s;__IMAGE_PULL_SECRET__;$IMAGE_PULL_SECRET_INLINE;g" $KUBERMATIC_CONFIG
sed -i "s;__KUBERMATIC_DOMAIN__;$KUBERMATIC_DOMAIN;g" $KUBERMATIC_CONFIG
sed -i "s;__KUBERMATIC_OSM_ENABLED__;$KUBERMATIC_OSM_ENABLED;g" $KUBERMATIC_CONFIG
sed -i "s;__DASHBOARD_VERSION__;$DASHBOARD_VERSION;g" $KUBERMATIC_CONFIG

HELM_VALUES_FILE="$(mktemp)"
cat << EOF > $HELM_VALUES_FILE
kubermaticOperator:
  image:
    repository: "quay.io/kubermatic/kubermatic$REPOSUFFIX"
    tag: "$KUBERMATIC_VERSION"

minio:
  credentials:
    accessKey: test
    secretKey: testtest

nginx:
  controller:
    replicaCount: 1

telemetry:
  # this is a meaningless, random UUID; we use a static one to,
  # if we ever had to, easily filter its data out of any data collector
  uuid: "559a1b90-b5d0-40aa-a74d-bd9e808ec10f"

  # ensure that we create at least one report
  schedule: "* * * * *"

  # instead of sending the data anywhere, we just print it to stdout
  # and later check if telemetry pods exist and if they output something
  reporterArgs:
    - stdout
    - --client-uuid=\$(CLIENT_UUID)
    - --record-dir=\$(RECORD_DIR)
EOF

# append custom Dex configuration
cat hack/ci/testdata/dex_values.yaml >> $HELM_VALUES_FILE

# to potentially make use of the EE images, we need to authenticate to quay.io first
retry 5 docker login -u "$QUAY_IO_USERNAME" -p "$QUAY_IO_PASSWORD" quay.io

# Install KKP into kind; this will for now (until the operator knows how to handle
# the new dashboard images) simply install KKP's default API (the current one when
# the KKP image was built, which is most likely 1 or 2 commits behind the dashboard
# right now). Once KKP is reconciled and running, we later pause the operator and
# replace the API with the Docker image built earlier, so that we actually test our
# local code.
TEST_NAME="Install KKP into kind"

docker run \
  --rm \
  --volume "$(dirname $KUBECONFIG):/kkp/kubeconfig" \
  --volume "$(dirname $KUBERMATIC_CONFIG):/kkp/config" \
  --volume "$(dirname $HELM_VALUES_FILE):/kkp/helmvalues" \
  --env "KUBECONFIG=/kkp/kubeconfig/$(basename $KUBECONFIG)" \
  --user root \
  --net=host \
  "quay.io/kubermatic/kubermatic$REPOSUFFIX:$KUBERMATIC_VERSION" \
  kubermatic-installer deploy kubermatic-master \
  --storageclass copy-default \
  --config "/kkp/config/$(basename $KUBERMATIC_CONFIG)" \
  --helm-values "/kkp/helmvalues/$(basename $HELM_VALUES_FILE)"

echodate "Waiting for Kubermatic Operator to deploy Master components..."
# sleep a bit to prevent us from checking the Deployments too early, before
# the operator had time to reconcile
sleep 5
retry 10 check_all_deployments_ready kubermatic

echodate "Finished installing Kubermatic"

TEST_NAME="Setup KKP Seed"
echodate "Installing Seed..."

# master&seed are the same cluster, but we still want to test that the
# installer can setup the seed components. Effectively, in these tests
# this is a NOP.
docker run \
  --rm \
  --volume "$(dirname $KUBECONFIG):/kkp/kubeconfig" \
  --volume "$(dirname $KUBERMATIC_CONFIG):/kkp/config" \
  --volume "$(dirname $HELM_VALUES_FILE):/kkp/helmvalues" \
  --env "KUBECONFIG=/kkp/kubeconfig/$(basename $KUBECONFIG)" \
  --user root \
  --net=host \
  "quay.io/kubermatic/kubermatic$REPOSUFFIX:$KUBERMATIC_VERSION" \
  kubermatic-installer deploy kubermatic-seed \
  --storageclass copy-default \
  --config "/kkp/config/$(basename $KUBERMATIC_CONFIG)" \
  --helm-values "/kkp/helmvalues/$(basename $HELM_VALUES_FILE)"

SEED_MANIFEST="$(mktemp)"
SEED_KUBECONFIG="$(cat $KUBECONFIG | sed 's/127.0.0.1.*/kubernetes.default.svc.cluster.local./' | base64 -w0)"

cp hack/ci/testdata/seed.yaml $SEED_MANIFEST

sed -i "s/__SEED_NAME__/$SEED_NAME/g" $SEED_MANIFEST
sed -i "s/__BUILD_ID__/$BUILD_ID/g" $SEED_MANIFEST
sed -i "s/__KUBECONFIG__/$SEED_KUBECONFIG/g" $SEED_MANIFEST

if [[ ! -z "${NUTANIX_E2E_ENDPOINT:-}" ]]; then
  sed -i "s/__NUTANIX_ENDPOINT__/$NUTANIX_E2E_ENDPOINT/g" $SEED_MANIFEST
fi

if [[ ! -z "${ANEXIA_LOCATION_ID:-}" ]]; then
  sed -i "s/__ANEXIA_LOCATION_ID__/$ANEXIA_LOCATION_ID/g" $SEED_MANIFEST
fi

if [[ ! -z "${VCD_URL:-}" ]]; then
  sed -i "s#__VCD_URL__#$VCD_URL#g" $SEED_MANIFEST
fi

kubectl apply --filename hack/ci/testdata/metering_s3_creds.yaml

retry 8 kubectl apply --filename $SEED_MANIFEST
retry 8 check_seed_ready kubermatic "$SEED_NAME"
echodate "Finished installing Seed"

sleep 5
echodate "Waiting for Deployments to roll out..."
retry 9 check_all_deployments_ready kubermatic
echodate "Kubermatic is ready."

echodate "Waiting for VPA to be ready..."
retry 8 check_all_deployments_ready kube-system
echodate "VPA is ready."

appendTrap cleanup_kubermatic_clusters_in_kind EXIT

TEST_NAME="Expose Dex and Kubermatic API"
echodate "Exposing Dex and Kubermatic API to localhost..."
kubectl port-forward --address 0.0.0.0 -n oauth svc/dex 5556 > /dev/null &
kubectl port-forward --address 0.0.0.0 -n kubermatic svc/kubermatic-api 8080:80 > /dev/null &
echodate "Finished exposing components"
