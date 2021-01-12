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

FROM ubuntu:18.04

RUN apt-get update -y
RUN apt-get install -y bash vim wget xz-utils make python
RUN apt-get build-dep -y nodejs

# just get a recent nodejs with npm included:
RUN wget -O /opt/n.tar.xz https://nodejs.org/dist/v14.12.0/node-v14.12.0-linux-arm64.tar.gz

# install node
RUN tar x -C /opt -f /opt/n.tar.xz
RUN for x in /opt/node*/bin/*; do ln -sfn $x /usr/local/bin ; done

# polish environment
RUN useradd -c 'Node User' -m -d /home/node -s /bin/bash node
USER node
ENV HOME /home/node
WORKDIR /home/node
