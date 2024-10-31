#!/usr/bin/env bash

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

# A list of allowed licenses for our production dependencies
ALLOWED_LICENSES="MIT;ISC;BSD-2-Clause;BSD-2-Clause-FreeBSD;BSD-3-Clause;Apache-2.0;Zlib;0BSD"

# A list of dependencies excluded from license check. Should be validated manually before excluding
# them from the check.
# UNKNOWN license:
#   - emitter-component (dependency of swagger-ui)
#   - btoa (dependency of swagger-ui)
# CC0-1.0 license:
#   - encode-3986 (dependency of swagger-ui)
#   - highlightjs-vue (dependency of swagger-ui)
# Unlicense license:
#   - zenscroll (dependency of swagger-ui)
# Python-2.0 license:
#   - argparse (dependency of js-yaml)
# CC-BY-4.0 license:
#   - caniuse-lite (dependency of multiple dependencies)
EXCLUDED_PACKAGES="emitter-component;btoa;encode-3986;zenscroll;argparse;caniuse-lite;highlightjs-vue"

LICENSE_CHECK_OUTPUT=$(npx license-compliance --production --allow ${ALLOWED_LICENSES} -e ${EXCLUDED_PACKAGES} -r detailed)

if [[ ${?} == 1 ]]; then
  echo "${LICENSE_CHECK_OUTPUT}"
  echo -e "\nLicense check: \e[31mFAILED\n" 1>&2
  exit 1
fi

echo -e "License check: \e[23mOK\n"
