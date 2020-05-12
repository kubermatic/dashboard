#!/bin/sh


image=localdev-dashboard

cd `dirname $0`
docker build -t $image .
