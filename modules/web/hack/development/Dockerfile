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

FROM node:16

# Configuration
ENV KUBERMATIC_DIR=/dashboard
# Used internally by the 'npm start'.
# Required to properly expose application inside the container.
ENV KUBERMATIC_HOST=0.0.0.0

# Copy source to the working directory
COPY . ${KUBERMATIC_DIR}

# Switch to the working directory
WORKDIR ${KUBERMATIC_DIR}

# Install dependencies
RUN npm ci --unsafe-perm

# Run npm command
CMD ${KUBERMATIC_NPM_CMD}
