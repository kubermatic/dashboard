## Purpose

This container provides an environment with recent nodejs and npm
to start development/testing. It does that without the need to
install any nodejs or npm on your local machine. All the dirt is
isolated in a container.
The container is meant to run with host-networking.

### Build:

./build.sh


### Use:

Make sure you fire up the locally running controller and api.
You should have 127.0.0.1:8080 and 127.0.0.1:8085 listening.

Also change `proxy.conf.json` to have `"target": "http://localhost:8080/"`.

```
cd .../dashboard-v2
# Run the container. Your working directory is important here.
./containers/localdev/run.sh

# Now in the container, you can build+run:
cd /host-pwd
make install
make run
```

Then you can access the dashboard locally at http://localhost:8000/
