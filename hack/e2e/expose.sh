#!/usr/bin/env bash

killall kubectl

# Expose dex to localhost
nohup kubectl port-forward -n oauth svc/dex 5556:5556 &

# Expose kubermatic API to localhost
nohup kubectl port-forward -n kubermatic svc/kubermatic-api 8080:80 &

# Expose local API server
nohup kubectl proxy &

rm nohup.out
