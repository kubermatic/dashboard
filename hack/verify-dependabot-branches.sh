#!/usr/bin/env bash

# Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

set -euo pipefail

cd $(dirname $0)/..
source hack/lib.sh

VERSION="$(grep -E '^KUBERMATIC_VERSION\?=' Makefile | cut -d= -f2)"
MINOR="$(echo "$VERSION" | cut -d. -f2)"

# A pre-release version has no release branch yet, so start from the previous minor.
if [[ "$VERSION" == *-* ]]; then
  MINOR=$((MINOR - 1))
fi

# Oldest first, to match the sorted list read from the Dependabot config below.
EXPECTED="release/v2.$((MINOR - 2)) release/v2.$((MINOR - 1)) release/v2.$MINOR"
ACTUAL="$(grep -oE 'release/v[0-9.]+' .github/dependabot.yml | sort -u | xargs)"

if [ "$ACTUAL" != "$EXPECTED" ]; then
  echodate "KUBERMATIC_VERSION is $VERSION, so .github/dependabot.yml must target: $EXPECTED"
  echodate "It currently targets: $ACTUAL"
  exit 1
fi

echodate "Dependabot targets the supported release branches: $EXPECTED"
