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

FROM quay.io/kubermatic/build:go-1.24-node-20-kind-0.27-6
LABEL maintainer="support@kubermatic.com"

ENV NG_CLI_ANALYTICS=ci

COPY . ${GOPATH}/src/github.com/kubermatic/dashboard
WORKDIR ${GOPATH}/src/github.com/kubermatic/dashboard

CMD ["make", "docker-run-custom"]
