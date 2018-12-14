# Kubermatic Dashboard
[![Status](https://drone.loodse.com/api/badges/kubermatic/dashboard-v2/status.svg)](https://drone.loodse.com/kubermatic/dashboard-v2)

## Development

### Preparation
Before you can start the application locally you should install the dependencies using `npm i` command.

### Starting the application
To start development server that will proxy API calls to the https://dev.kubermatic.io/ use 
`npm start` command and navigate to http://localhost:8000/.

If you would like to connect with your local API then you should use `npm run serve:local`.

The application will automatically reload if you change any of the source files.

### Formatting the code
We are using [Google TypeScript Style](https://github.com/google/ts-style) and [Stylelint](https://github.com/stylelint/stylelint) to ensure consistent code formatting and linting.

To check if files are correctly formatted and linted use `npm run check` command.

To automatically fix issues run `npm run fix` command.

### Running the unit tests
Run `npm test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running the end-to-end tests
Run `npm run e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `npm run serve`.

### Building the application
Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

Please check `package.json` for more information regarding the available commands and the project setup.
