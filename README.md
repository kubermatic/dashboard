# Kubermatic

This project was generated with [angular-cli](https://github.com/angular/angular-cli) version 1.0.0-beta.24.

## Development server
Run `npm run serve:proxy` for a dev server. Navigate to `http://localhost:8000/`. This will proxy api calls to the target specified in proxy.conf.json, which is https://beta.kubermatic.io. 
The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive/pipe/service/class`.

## Build

Run `npm run build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `npm run test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `npm run e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `npm run serve`.

## Troubleshooting


- **Node Sass could not find a binding for your current environment** 
  (for example Windows 64-bit with Node.js 7.x)
  - Rebuild on target system: 
    - rm node_module 
    - npm install
    - npm rebuild node-sass  

## Further help

To get more help on the `angular-cli` use `ng --help` or go check out the [Angular-CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
