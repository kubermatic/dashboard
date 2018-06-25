#!/bin/sh


image=localdev-dashboard-v2

cd `dirname $0`
docker build -t $image .
