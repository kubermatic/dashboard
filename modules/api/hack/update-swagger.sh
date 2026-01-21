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

set -euo pipefail

cd $(dirname $0)/../../..
source hack/lib.sh

API=modules/api

CONTAINERIZE_IMAGE=quay.io/kubermatic/build:go-1.25-node-22-6 containerize ./$API/hack/update-swagger.sh

echodate "Generating swagger spec"
cd $API/cmd/kubermatic-api/

# TEMPORARY WORKAROUND to avoid inconstant swagger generation:
# Because kubermatic repository still contains api types, swagger generation is not consistent.
# Sometime the  "x-go-package" point on dashboard repo and sometime on kubermatic repo.
# To avoid this exclude kubermatic packages with this option -x k8c.io/kubermatic/*
#
# this workaround will be removed once api will be totally removed from kubermatic repository
run_swagger generate spec --tags=ee --scan-models -o swagger.json -x k8c.io/kubermatic/* -x github.com/sigstore/rekor/pkg/generated/models -x k8s.io/api/admissionregistration/*
echodate "Completed."
run_swagger validate swagger.json
