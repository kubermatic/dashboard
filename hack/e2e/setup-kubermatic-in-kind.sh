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

export KUBERMATIC_VERSION=latest
export TARGET_BRANCH="${PULL_BASE_REF:-master}"
export KUBERMATIC_OIDC_LOGIN="roxy@loodse.com"
export KUBERMATIC_OIDC_PASSWORD="password"

# Set docker config
echo "$IMAGE_PULL_SECRET_DATA" | base64 -d > /config.json

REPO_ROOT="$(realpath .)"
cd "${GOPATH}/src/github.com/kubermatic/kubermatic"

if [[ ${TARGET_BRANCH} == release* ]]; then
  VERSION=${TARGET_BRANCH#release/}
  TAG_VERSION=$(git tag | egrep "${VERSION}" | tail -n 1 || true)
  if [ -z "${TAG_VERSION}" ]; then
    TAG_VERSION=latest
  fi
  export KUBERMATIC_VERSION=${TAG_VERSION}
fi

REPOSUFFIX=""
if [ "$KUBERMATIC_EDITION" != "ce" ]; then
  REPOSUFFIX="-$KUBERMATIC_EDITION"
fi

HELM_VALUES_FILE="$(mktemp)"
cat <<EOF >$HELM_VALUES_FILE
kubermaticOperator:
  image:
    repository: "quay.io/kubermatic/kubermatic$REPOSUFFIX"
    tag: "$KUBERMATIC_VERSION"
EOF

# append custom Dex configuration
cat hack/ci/testdata/oauth_values.yaml >> $HELM_VALUES_FILE

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

export KUBERMATIC_DEX_VALUES_FILE=$(realpath hack/ci/testdata/oauth_values.yaml)

# Build binaries and load the Docker images into the kind cluster
echodate "Building binaries for $KUBERMATIC_VERSION"
TEST_NAME="Build Kubermatic binaries"
make kubermatic-installer

echo "OK"
exit 0

TEST_NAME="Deploy Kubermatic"
echodate "Deploying Kubermatic [${KUBERMATIC_VERSION}] using Helm..."

# --force is needed in case the first attempt at installing didn't succeed
# see https://github.com/helm/helm/pull/3597
retry 3 helm upgrade --install --force --wait --timeout 300 \
  --set=kubermatic.isMaster=true \
  --set=kubermatic.imagePullSecretData=$IMAGE_PULL_SECRET_DATA \
  --set-string=kubermatic.controller.addons.kubernetes.image.tag="$KUBERMATIC_VERSION" \
  --set-string=kubermatic.controller.image.tag="$KUBERMATIC_VERSION" \
  --set-string=kubermatic.controller.addons.openshift.image.tag="$KUBERMATIC_VERSION" \
  --set-string=kubermatic.api.image.tag="$KUBERMATIC_VERSION" \
  --set=kubermatic.controller.datacenterName=${SEED_NAME} \
  --set=kubermatic.controller.workerCount=100 \
  --set=kubermatic.api.replicas=1 \
  --set-string=kubermatic.masterController.image.tag="$KUBERMATIC_VERSION" \
  --set-string=kubermatic.ui.image.tag=latest \
  --set=kubermatic.ui.replicas=0 \
  --set=kubermatic.ingressClass=non-existent \
  --set=kubermatic.checks.crd.disable=true \
  --set=kubermatic.datacenters='' \
  --set=kubermatic.dynamicDatacenters=true \
  --set=kubermatic.dynamicPresets=true \
  --set=kubermatic.kubeconfig="$(cat $KUBECONFIG|sed 's/127.0.0.1.*/kubernetes.default.svc.cluster.local./'|base64 -w0)" \
  --set=kubermatic.auth.tokenIssuer=http://dex.oauth:5556/dex \
  --set=kubermatic.auth.clientID=kubermatic \
  --set=kubermatic.auth.serviceAccountKey=$SERVICE_ACCOUNT_KEY \
  --set=kubermatic.apiserverDefaultReplicas=1 \
  --set=kubermatic.deployVPA=false \
  --namespace=kubermatic \
  --values ${VALUES_FILE} \
  kubermatic \
  charts/kubermatic/

echodate "Finished installing Kubermatic"

echodate "Installing Seed..."
SEED_MANIFEST="$(mktemp)"
cat <<EOF >$SEED_MANIFEST
kind: Secret
apiVersion: v1
metadata:
  name: ${SEED_NAME}-kubeconfig
  namespace: kubermatic
data:
  kubeconfig: "$(cat $KUBECONFIG|sed 's/127.0.0.1.*/kubernetes.default.svc.cluster.local./'|base64 -w0)"

---
kind: Seed
apiVersion: kubermatic.k8s.io/v1
metadata:
  name: ${SEED_NAME}
  namespace: kubermatic
  labels:
    worker-name: "$BUILD_ID"
spec:
  country: Germany
  location: Hamburg
  kubeconfig:
    name: ${SEED_NAME}-kubeconfig
    namespace: kubermatic
    fieldPath: kubeconfig
  datacenters:
    byo-kubernetes:
      location: Frankfurt
      country: DE
      spec:
         bringyourown: {}
    alibaba-eu-central-1a:
      location: Frankfurt
      country: DE
      spec:
        alibaba:
          region: eu-central-1
    aws-eu-central-1a:
      location: EU (Frankfurt)
      country: DE
      spec:
        aws:
          region: eu-central-1
    hetzner-nbg1:
      location: Nuremberg 1 DC 3
      country: DE
      spec:
        hetzner:
          datacenter: nbg1-dc3
    vsphere-ger:
      location: Hamburg
      country: DE
      spec:
        vsphere:
          endpoint: "https://vcenter.loodse.io"
          datacenter: "dc-1"
          datastore: "exsi-nas"
          cluster: "cl-1"
          root_path: "/dc-1/vm/e2e-tests"
          templates:
            ubuntu: "machine-controller-e2e-ubuntu"
            centos: "machine-controller-e2e-centos"
            coreos: "machine-controller-e2e-coreos"
    azure-westeurope:
      location: "Azure West europe"
      country: NL
      spec:
        azure:
          location: "westeurope"
    gcp-westeurope:
      location: "Europe West (Germany)"
      country: DE
      spec:
        gcp:
          region: europe-west3
          zone_suffixes:
          - c
    packet-ewr1:
      location: "Packet EWR1 (New York)"
      country: US
      spec:
        packet:
          facilities:
          - ewr1
    do-ams3:
      location: Amsterdam
      country: NL
      spec:
        digitalocean:
          region: ams3
    do-fra1:
      location: Frankfurt
      country: DE
      spec:
        digitalocean:
          region: fra1
    kubevirt-europe-west3-c:
      location: Frankfurt
      country: DE
      spec:
        kubevirt: {}
    syseleven-dbl1:
      country: DE
      location: Syseleven - dbl1
      spec:
        openstack:
          auth_url: https://api.cbk.cloud.syseleven.net:5000/v3
          availability_zone: dbl1
          dns_servers:
          - 37.123.105.116
          - 37.123.105.117
          enforce_floating_ip: true
          ignore_volume_az: false
          images:
            centos: kubermatic-e2e-centos
            coreos: kubermatic-e2e-coreos
            ubuntu: kubermatic-e2e-ubuntu
          node_size_requirements:
            minimum_memory: 0
            minimum_vcpus: 0
          region: dbl
EOF
retry 8 kubectl apply -f $SEED_MANIFEST
echodate "Finished installing Seed"

function kill_port_forwardings() {
  echodate "Stopping any previous port-forwardings to port $1..."
  ss -tlpn "sport = :$1" | (grep -oP "(?<=pid=)[0-9]+" || true) | uniq | tee | xargs -r kill
}

function cleanup_kubermatic_clusters_in_kind {
  originalRC=$?

  # Tolerate errors and just continue
  set +e
  # Clean up clusters
  echodate "Cleaning up clusters..."
  kubectl delete cluster --all --ignore-not-found=true
  echodate "Done cleaning up clusters"

  # Kill all descendant processes
  pkill -P $$
  set -e

  return $originalRC
}
appendTrap cleanup_kubermatic_clusters_in_kind EXIT

TEST_NAME="Expose Dex and Kubermatic API"
echodate "Exposing Dex and Kubermatic API to localhost..."
kill_port_forwardings 5556
kill_port_forwardings 8080
kubectl port-forward --address 0.0.0.0 -n oauth svc/dex 5556 &
kubectl port-forward --address 0.0.0.0 -n kubermatic svc/kubermatic-api 8080:80 &
echodate "Finished exposing components"

echodate "Waiting for Dex to be ready"
retry 5 curl -sSf  http://127.0.0.1:5556/dex/healthz
echodate "Dex became ready"

echodate "Waiting for Kubermatic API to be ready"
retry 5 curl -sSf  http://127.0.0.1:8080/api/v1/healthz
echodate "API became ready"

cd -

echodate "Creating UI Azure preset..."
cat <<EOF > preset-azure.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-azure
  namespace: kubermatic
spec:
  azure:
    tenantId: ${AZURE_E2E_TESTS_TENANT_ID}
    subscriptionId: ${AZURE_E2E_TESTS_SUBSCRIPTION_ID}
    clientId: ${AZURE_E2E_TESTS_CLIENT_ID}
    clientSecret: ${AZURE_E2E_TESTS_CLIENT_SECRET}
EOF
retry 2 kubectl apply -f preset-azure.yaml

echodate "Creating UI DigitalOcean preset..."
cat <<EOF > preset-digitalocean.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-digitalocean
  namespace: kubermatic
spec:
  digitalocean:
    token: ${DO_E2E_TESTS_TOKEN}
EOF
retry 2 kubectl apply -f preset-digitalocean.yaml

echodate "Creating UI GCP preset..."
cat <<EOF > preset-gcp.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-gcp
  namespace: kubermatic
spec:
  gcp:
    serviceAccount: ${GOOGLE_SERVICE_ACCOUNT}
EOF
retry 2 kubectl apply -f preset-gcp.yaml

echodate "Creating UI OpenStack preset..."
cat <<EOF > preset-openstack.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-openstack
  namespace: kubermatic
spec:
  openstack:
    username: ${OS_USERNAME}
    password: ${OS_PASSWORD}
    tenant: ${OS_TENANT_NAME}
    domain: ${OS_DOMAIN}
EOF
retry 2 kubectl apply -f preset-openstack.yaml

echodate "Applying user..."
retry 2 kubectl apply -f $(dirname $0)/fixtures/user.yaml
