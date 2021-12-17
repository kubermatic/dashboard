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

FROM quay.io/kubermatic/build:go-1.17-node-16-kind-0.11-5 AS kkpbuild

FROM cypress/browsers:node16.5.0-chrome94-ff93
LABEL maintainer="support@kubermatic.com"

ENV GO_VERSION="1.17.5"

COPY --from=kkpbuild /usr/local/bin/mc /usr/local/bin/mc
COPY --from=kkpbuild /root/.bashrc /root/.bashrc

RUN apt-get update -qq && \
    apt-get install -y \
      curl \
      bash \
      bash-completion \
      gettext \
      git && \
    rm -rf /var/lib/apt/lists/*

ENV PATH /usr/local/go/bin:$PATH
