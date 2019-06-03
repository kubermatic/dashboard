# Kubermatic Dashboard
[![Status](https://drone.loodse.com/api/badges/kubermatic/dashboard-v2/status.svg)](https://drone.loodse.com/kubermatic/dashboard-v2)
[![codecov](https://codecov.io/gh/kubermatic/dashboard-v2/branch/master/graph/badge.svg?token=njXM3OrmAM)](https://codecov.io/gh/kubermatic/dashboard-v2)

## Development

### Preparation
Before you can start the application locally you should install the dependencies using `npm i` command.

### Starting the application

#### Using locally installed NodeJS
To start development server that will proxy API calls to the https://dev.kubermatic.io/ use 
`npm start` command and navigate to http://localhost:8000/.

If you would like to connect with your local API then you should use `npm run serve:local`.

The application will automatically reload if you change any of the source files.

#### Using a Docker container

##### With dev.kubermatic.io API
```bash
./hack/run-dashboard.sh
```

##### With locally running API
```bash
./hack/run-local-dashboard.sh
```

### Formatting the code
We are using [Google TypeScript Style](https://github.com/google/ts-style) and [Stylelint](https://github.com/stylelint/stylelint) to ensure consistent code formatting and linting.

To check if files are correctly formatted and linted use `npm run check` command.

To automatically fix issues run `npm run fix` command.

### Running the unit tests
Run `npm test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running the end-to-end tests
Currently e2e tests are being executed against `dev.kubermatic.io` server. Before running tests make sure that `CYPRESS_KUBERMATIC_DEX_DEV_E2E_USERNAME`, `CYPRESS_KUBERMATIC_DEX_DEV_E2E_USERNAME_2` and `CYPRESS_KUBERMATIC_DEX_DEV_E2E_PASSWORD` environment variables are set. To run end-to-end tests, simply execute `npm run e2e`.

**NOTE**: For the local tests `roxy@kubermatic.io` & `roxy2@kubermatic.io` users can be used. Password can be found in our vault inside `e2e-dex` secret.

### Building the application
Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

Please check `package.json` for more information regarding the available commands and the project setup.

### Running commands within the Docker container

This will run the below commands in a NodeJS Docker container with the source code mounted and set as working directory.
```bash
./hack/run-in-docker.sh npm install
./hack/run-in-docker.sh npm foo
./hack/run-in-docker.sh npm bar
```
