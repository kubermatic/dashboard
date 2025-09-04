# Development

This document describes how to use and run the KKP Dashboard.

## Running Dashboard Locally

This approach assumes that you have all required dependencies available on your local machine:

- Node >= v22.0.0
- NPM >= v10.0.0
- Go v1.24+ (required only by the production build)

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
It is always based on our latest `main` build, but be aware that it might be unstable.

### Using the Local API

In order to start the KKP API locally, refer to the [Kubermatic](https://github.com/kubermatic/kubermatic) repository
documentation.

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

## Running Unit Tests

Run `npm test` to execute the unit tests via [Jest](https://jestjs.io/).

#### Unit Testing Guideline

- Component tests should be located in the same directory as the tested component and named `component.spec.ts`.
- Test utils and mocks are placed in `src/test`.
- Focus on testing components that are shared across the project (see `src/app/shared`).
- Try to cover any conditional renders in tests (e.g. displaying spinner while waiting for data).
- If a component is expected to react on events, try to cover that in tests.
- Avoid testing too deep. Component's children should be tested separately.
- Avoid complex CSS queries, mark an element with an `id` instead.
- For complex testing scenarios stick to e2e tests.
- Do not overengineer your tests. Keep in mind that tests are code as well and we need to maintain them.

## Running End-to-end Tests

#### Mocked Tests

Mocked tests can be run locally without need to connect to the whole KKP.

```
KUBERMATIC_EDITION="ee" CYPRESS_MOCKS="true" npm run e2e:mock
```

#### Full Tests

Full end-to-end tests by default are executed against `dev.kubermatic.io` server.

```
KUBERMATIC_EDITION="ee" CYPRESS_USERNAME="roxy@kubermatic.io" CYPRESS_USERNAME_2="roxy2@kubermatic.io" CYPRESS_PASSWORD="" npm run e2e
```

`CYPRESS_PASSWORD` contains password for users defined in `CYPRESS_USERNAME` and `CYPRESS_USERNAME_2`. It can be found
in our vault inside `e2e-dex` secret.

**NOTE**: To test community edition use `KUBERMATIC_EDITION="ce"`.

**NOTE**: Tests can be also run manually with `npm run cy` command. It requires app running at `http://localhost:8000`.

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
