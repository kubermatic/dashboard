#!/usr/bin/env bash

# Copyright 2023 The Kubermatic Kubernetes Platform contributors.
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

### Updates the docs repository by copying over a `swagger.json` file.

set -euo pipefail

cd $(dirname $0)/../../../..
source hack/lib.sh

TARGET_DIR=docs_sync
REVISION=$(git rev-parse --short HEAD)

# configure Git
git config --global user.email "dev@kubermatic.com"
git config --global user.name "Prow CI Robot"
git config --global core.sshCommand 'ssh -o CheckHostIP=no -i /ssh/id_rsa'
ensure_github_host_pubkey

# create a fresh clone
git clone git@github.com:kubermatic/docs.git $TARGET_DIR
cd $TARGET_DIR

# copy `swagger.json` over
mkdir -p content/kubermatic/main/data
cp ../modules/api/cmd/kubermatic-api/swagger.json content/kubermatic/main/data/swagger.json

# update repo
git add .

if ! git diff --cached --stat --exit-code; then
  git commit -m "Syncing with kubermatic/dashboard@$REVISION"
  git push
fi
