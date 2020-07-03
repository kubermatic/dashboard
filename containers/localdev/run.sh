#!/bin/sh
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
#
# run this script from the root of this repository (PWD).
# you will have /host-pwd inside the container to work.
#

image=localdev-dashboard
name=$image

docker run \
	--name $name \
	--network host \
	--rm -ti \
	--user=$(id -u) \
	-v $PWD:/host-pwd \
	$image \
	bash

