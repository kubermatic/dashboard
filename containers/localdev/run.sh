#!/bin/sh
#
# run this script from the root of this repository (PWD).
# you will have /host-pwd inside the container to work.
#

image=localdev-dashboard-v2
name=$image

docker run \
	--name $name \
	--network host \
	--rm -ti \
	--user=$(id -u) \
	-v $PWD:/host-pwd \
	$image \
	bash

