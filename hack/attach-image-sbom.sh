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
cd $(dirname "$0")/..
source hack/lib.sh # for echodate / retry

imageRef="${1:?image reference is required}" # e.g. quay.io/kubermatic/osm:v1.12.0
repo="${imageRef%@*}"                        # drop digest, if any
if [[ "${repo##*/}" == *:* ]]; then          # tag only lives in the last path component
  repo="${repo%:*}"                          # drop tag (keeps registry port intact)
fi
mkdir -p _dist/images

# SBOM + attach for ONE concrete image digest
sbom_for_digest() {
  local digest="$1" # sha256:... of the platform-specific image manifest (never the index)
  local suffix="$2" # only used for the local SBOM filename: "" single-arch, "-amd64"/"-arm64" multi-arch
  local ref="$repo@$digest"

  # step 2: already has an SBOM? then do nothing
  # fetch first so registry/auth errors fail the script instead of reading as "no SBOM"
  local referrers
  referrers="$(retry 3 oras discover --format json "$ref")"
  if jq -e '[.. | objects | select(.artifactType? == "application/spdx+json")] | length > 0' <<< "$referrers" > /dev/null; then
    echodate "SBOM already attached to $ref, skipping."
    return
  fi

  # step 3: generate
  local sbomFile="_dist/images/$(basename "$repo")$suffix.sbom.spdx.json"
  echodate "Generating SBOM for $ref..."
  syft "registry:$ref" -o "spdx-json=$sbomFile"

  # step 4: attach next to the image in the registry
  echodate "Attaching $(basename "$sbomFile") to $ref..."
  (cd "$(dirname "$sbomFile")" && retry 3 oras attach --artifact-type application/spdx+json \
    "$ref" "$(basename "$sbomFile"):application/spdx+json")
}

# step 1: what is behind the tag?
manifest="$(oras manifest fetch "$imageRef")"

if jq -e '.manifests' <<< "$manifest" > /dev/null; then
  # multi-arch: a list of per-arch images; skip buildx's "unknown/unknown" attestation entries
  jq -r '.manifests[] | select(.platform.os != "unknown")
         | "\(.digest) \(.platform.architecture)\(.platform.variant // "")"' <<< "$manifest" |
    while read -r digest arch; do
      sbom_for_digest "$digest" "-$arch"
    done
else
  # single-arch: just one image
  sbom_for_digest "$(oras manifest fetch --descriptor "$imageRef" | jq -er '.digest')" ""
fi
