# Development

## Preparation
Before you can start the application locally you should install the dependencies using `npm ci` command.

## Starting the Application

### Using the Community Edition

To use the Kubermatic Kubernetes Platform Community Edition you should set `KUBERMATIC_EDITION=ce`
environment variable before running any of the following commands. Using the application without
mentioned environment variable leads to using Kubermatic Kubernetes Platform Enterprise Edition.

**Note:** You can verify your current setup by running the `npm run vi` command.
**Note:** `src/assets/config/version.json` should not be edited manually.

### Using Local Environment
To start development server that will proxy API calls to the https://dev.kubermatic.io/ use
`npm start` command and navigate to http://localhost:8000/.

If you would like to connect with your local API then you should use `npm run serve:local`.

The application will automatically reload if you change any of the source files.

### Using a Docker Container

#### With dev.kubermatic.io API
```bash
./hack/run-dashboard.sh
```

#### With Local API
```bash
./hack/run-local-dashboard.sh
```

## Formatting the Code
We are using [Google TypeScript Style](https://github.com/google/ts-style) and
[Stylelint](https://github.com/stylelint/stylelint) to ensure consistent code formatting and linting.

To check if files are formatted and linted use `npm run check` command.

To automatically fix issues run `npm run fix` command.

## Running Unit Tests
Run `npm test` to execute the unit tests via [Jest](https://jestjs.io/).

## Running End-to-end Tests
#### Mocked Tests
Mocked tests can be run locally without need to connect to the whole KKP.

```
USE_MOCKS="true" CYPRESS_USE_MOCKS="true" npm run e2e:mock
```

Additionally, you can choose which version will be tested with `KUBERMATIC_EDITION` environment variable.

#### Full Tests
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

## Running Commands Within the Docker Container

This will run the below commands in a NodeJS Docker container with the source code mounted and set as working directory.
```bash
./hack/run-in-docker.sh npm install
./hack/run-in-docker.sh npm foo
./hack/run-in-docker.sh npm bar
```
