#!/usr/bin/env bash

export KUBECONFIG=~/.kube/config

# Expose dex to localhost
kubectl port-forward --address 0.0.0.0 -n oauth svc/dex 5556 > /dev/null 2> /dev/null &

# Expose kubermatic API to localhost
kubectl port-forward --address 0.0.0.0 -n kubermatic svc/kubermatic-api 8080:80 > /dev/null 2> /dev/null &
