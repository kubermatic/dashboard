#!/bin/sh

# Start docker daemon
nohup sh -c dockerd &

# Infinite loop
sh -ec "while :; do echo '.'; sleep 5 ; done"
