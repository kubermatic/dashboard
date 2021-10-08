# Development

This document describes how to use and run the KKP Dashboard.

## Running Dashboard Locally

This approach assumes that you have all required dependencies available on your local machine:
- Node v14 - v16
- NPM v6+
- Go v1.16+ (required only by the production build)

## Preparation
Install the application dependencies by running:
```bash
npm ci
```

## Starting the Application

There are multiple ways to start the application. We'll describe all of them shortly.

### Using the Remote API
The easiest way to start the Dashboard is by running:
```bash
npm start
```

It will run a proxy for the API hosted at [dev.kubermatic.io](https://dev.kubermatic.io). 
It is always based on our latest `master` build, but be aware that it might be unstable.

### Using the Local API
In order to start the KKP API locally, refer to the [Kubermatic](https://github.com/kubermatic/kubermatic) repository documentation. 

Once you have started your local API, start the Dashboard by running:
```bash
npm run start:local
```

### Using the Community Edition

To use the Kubermatic Kubernetes Platform Community Edition you should set `KUBERMATIC_EDITION=ce`
environment variable before running any of the following commands. Using the application without
mentioned environment variable leads to using Kubermatic Kubernetes Platform Enterprise Edition.

**Note:** You can verify your current setup by running the `npm run vi` command.
**Note:** `src/assets/config/version.json` should not be edited manually.

## Formatting the Code
We are using [Google TypeScript Style](https://github.com/google/ts-style) and
[Stylelint](https://github.com/stylelint/stylelint) to ensure consistent code formatting and linting.

To check if files are formatted and linted use `npm run check` command.

To automatically fix issues run `npm run fix` command.

## Running the Unit Tests
Run `npm test` to execute the unit tests via [Jest](https://jestjs.io/).

## Running the End-to-end Tests
End-to-end tests by default are executed against `dev.kubermatic.io` server. Before running tests set
`CYPRESS_KUBERMATIC_DEX_DEV_E2E_USERNAME`, `CYPRESS_KUBERMATIC_DEX_DEV_E2E_USERNAME_2` and
`CYPRESS_KUBERMATIC_DEX_DEV_E2E_PASSWORD` environment variables. To run tests, execute `npm run e2e`.

**NOTE**: For the local tests `roxy@kubermatic.io` & `roxy2@kubermatic.io` users can be used. Password can be found in
our vault inside `e2e-dex` secret.

**NOTE**: `npm run e2e` command uses configuration from `src/environments/environment.e2e.ts`. You can modify it to
match your setup.

**NOTE**: End-to-end tests can be also run manually with `npm run cy` command. It requires app running at
`http://localhost:8000`.

## Building the Application
Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory.

Please check `package.json` for more information regarding the available commands and the project setup.

## Running NPM Inside a Docker Container

We support two ways of running the NPM commands inside a docker container:
- #### [Host-based](#host-based)
- #### [Container-based](#container-based)

**NOTE:** It should be possible to run most `npm` scripts available in `package.json` file this way.

### Host-based
This approach will mount a whole Dashboard directory in RW mode inside the docker container and
the container will directly manipulate your files on the host machine. It will also share your host network with the container. 
The advantage here is that you do not have to install required dependencies such as Node or NPM. Instead of running `npm` commands
directly, simply run:

```bash
./hack/run-in-docker.sh npm ci
```

After installing the dependencies, you can start Dashboard by running:
```bash
./hack/run-in-docker.sh npm start
```

or if you want to start it against your local API run:
```bash
./hack/run-in-docker.sh npm run start:local
```

### Container-based
This approach will first build a docker image and prepare all dependencies and whole environment inside the docker container.
The container will expose the application on the default `8000` port, and it will be accessible at [localhost:8000](http://localhost:8000).
It does not directly manipulate your host files, however the `src` directory is mounted inside the container in order to allow watching
for source code changes and rebuilding the application on the fly. 

Start Dashboard by running:
```bash
./hack/development/run-npm-in-docker.sh npm start
```

**NOTE:** Currently, running Dashboard this way only supports connecting to the remote API.
