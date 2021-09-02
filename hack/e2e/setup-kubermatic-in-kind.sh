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
cat $REPO_ROOT/hack/e2e/fixtures/oauth_values.yaml >> $HELM_VALUES_FILE

# prepare to run kubermatic-installer
KUBERMATIC_CONFIG="$(mktemp)"
IMAGE_PULL_SECRET_INLINE="$(echo "$IMAGE_PULL_SECRET_DATA" | base64 --decode | jq --compact-output --monochrome-output '.')"
KUBERMATIC_DOMAIN="${KUBERMATIC_DOMAIN:-ci.kubermatic.io}"

cp $REPO_ROOT/hack/e2e/fixtures/kubermatic.yaml $KUBERMATIC_CONFIG

sed -i "s;__SERVICE_ACCOUNT_KEY__;$SERVICE_ACCOUNT_KEY;g" $KUBERMATIC_CONFIG
sed -i "s;__IMAGE_PULL_SECRET__;$IMAGE_PULL_SECRET_INLINE;g" $KUBERMATIC_CONFIG
sed -i "s;__KUBERMATIC_DOMAIN__;$KUBERMATIC_DOMAIN;g" $KUBERMATIC_CONFIG

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

# Build binaries and load the Docker images into the kind cluster
echodate "Building binaries for $KUBERMATIC_VERSION"
TEST_NAME="Build Kubermatic binaries"
KUBERMATICDOCKERTAG=latest UIDOCKERTAG=latest make kubermatic-installer

TEST_NAME="Deploy Kubermatic"
echodate "Deploying Kubermatic [${KUBERMATIC_VERSION}]..."

./_build/kubermatic-installer deploy --disable-telemetry \
  --storageclass copy-default \
  --config "$KUBERMATIC_CONFIG" \
  --helm-values "$HELM_VALUES_FILE" \
  --helm-binary "helm3"

echodate "Finished installing Kubermatic"
cd $REPO_ROOT

echodate "Installing Seed..."
SEED_MANIFEST="$(mktemp)"
SEED_KUBECONFIG="$(cat $KUBECONFIG | sed 's/127.0.0.1.*/kubernetes.default.svc.cluster.local./' | base64 -w0)"

cp hack/e2e/fixtures/seed.yaml $SEED_MANIFEST

sed -i "s/__SEED_NAME__/$SEED_NAME/g" $SEED_MANIFEST
sed -i "s/__BUILD_ID__/$BUILD_ID/g" $SEED_MANIFEST
sed -i "s/__KUBECONFIG__/$SEED_KUBECONFIG/g" $SEED_MANIFEST

retry 8 kubectl apply -f $SEED_MANIFEST
echodate "Finished installing Seed"

sleep 5
echodate "Waiting for Kubermatic Operator to deploy Seed components..."
retry 8 check_all_deployments_ready kubermatic
echodate "Kubermatic Seed is ready."

echodate "Waiting for VPA to be ready..."
retry 8 check_all_deployments_ready kube-system
echodate "VPA is ready."

appendTrap cleanup_kubermatic_clusters_in_kind EXIT

TEST_NAME="Expose Dex and Kubermatic API"
echodate "Exposing Dex and Kubermatic API to localhost..."

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: dex-nodeport
  namespace: oauth
spec:
  type: NodePort
  ports:
    - name: dex
      port: 5556
      protocol: TCP
      nodePort: 32000
  selector:
    app: dex
EOF

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: kubermatic-api-nodeport
  namespace: kubermatic
spec:
  type: NodePort
  ports:
    - name: http
      port: 8080
      protocol: TCP
      nodePort: 32001
  selector:
    app.kubernetes.io/name: kubermatic-api
EOF
echodate "Finished exposing components"

echodate "Creating UI AWS preset..."
cat <<EOF > preset-aws.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-aws
  namespace: kubermatic
spec:
  aws:
    accessKeyId: ${AWS_E2E_TESTS_KEY_ID}
    secretAccessKey: ${AWS_E2E_TESTS_SECRET}
    datacenter: ${AWS_E2E_TESTS_DATACENTER}
    vpcId: ${AWS_E2E_TESTS_VPC_ID}
EOF
retry 2 kubectl apply -f preset-aws.yaml

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

echodate "Creating UI KubeVirt preset..."
cat <<EOF > preset-kubevirt.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-kubevirt
  namespace: kubermatic
spec:
  kubevirt:
    kubeconfig: '${KUBEVIRT_E2E_TESTS_KUBECONFIG}'

EOF
retry 2 kubectl apply -f preset-kubevirt.yaml

echodate "Creating UI OpenStack preset..."
cat <<EOF > preset-openstack.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-openstack
  namespace: kubermatic
spec:
  openstack:
    datacenter: ${OS_DATACENTER}
    domain: ${OS_DOMAIN}
    floatingIpPool: ${OS_FLOATING_IP_POOL}
    password: ${OS_PASSWORD}
    tenant: ${OS_TENANT_NAME}
    tenantID: ${OS_TENANT_ID}
    username: ${OS_USERNAME}
EOF
retry 2 kubectl apply -f preset-openstack.yaml

echodate "Creating UI Packet preset..."
cat <<EOF > preset-packet.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-packet
  namespace: kubermatic
spec:
  packet:
    apiKey: ${PACKET_API_KEY}
    projectId: ${PACKET_PROJECT_ID}
EOF
retry 2 kubectl apply -f preset-packet.yaml

echodate "Creating UI Anexia preset..."
cat <<EOF > preset-anexia.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-anexia
  namespace: kubermatic
spec:
  anexia:
    token: ${ANEXIA_TOKEN}
EOF
retry 2 kubectl apply -f preset-anexia.yaml

echodate "Creating UI Hetzner preset..."
cat <<EOF > preset-hetzner.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-hetzner
  namespace: kubermatic
spec:
  hetzner:
    token: ${HZ_E2E_TOKEN}
EOF
retry 2 kubectl apply -f preset-hetzner.yaml

echodate "Creating UI VSPhere preset..."
cat <<EOF > preset-vsphere.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-vsphere
  namespace: kubermatic
spec:
  vsphere:
    username: ${VSPHERE_E2E_USERNAME}
    password: ${VSPHERE_E2E_PASSWORD}
EOF
retry 2 kubectl apply -f preset-vsphere.yaml

echodate "Creating UI Alibaba preset..."
cat <<EOF > preset-alibaba.yaml
apiVersion: kubermatic.k8s.io/v1
kind: Preset
metadata:
  name: e2e-alibaba
  namespace: kubermatic
spec:
  alibaba:
    accessKeyId: ${ALIBABA_ACCESS_KEY_ID}
    accessKeySecret: ${ALIBABA_ACCESS_KEY_SECRET}
EOF
retry 2 kubectl apply -f preset-alibaba.yaml

echodate "Applying user..."
retry 2 kubectl apply -f hack/e2e/fixtures/user.yaml
