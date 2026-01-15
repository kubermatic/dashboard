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

FROM docker.io/alpine:3.23
LABEL maintainer="support@kubermatic.com"

RUN apk add -U ca-certificates && rm -rf /var/cache/apk/*

COPY ./modules/api/_build/ /usr/local/bin/
COPY ./modules/web/_build/ /usr/local/bin/
COPY ./modules/api/cmd/kubermatic-api/swagger.json /opt/swagger.json
COPY ./modules/web/dist /dist

USER nobody

# this default CMD is for the legacy KKP Operator, which did not
# specify an explicit command in the dashboard Deployment
CMD ["dashboard"]
