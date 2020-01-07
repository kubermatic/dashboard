// https://github.com/thymikee/jest-preset-angular#brief-explanation-of-config

const tsJestPreset = require('jest-preset-angular/jest-preset').globals['ts-jest'];

module.exports = {
  preset: 'jest-preset-angular',
  roots: ['src/app'],
  setupFilesAfterEnv: ['<rootDir>/src/test.base.ts'],
  moduleNameMapper: {
    '@app/(.*)': '<rootDir>/src/app/$1',
    '@core/(.*)': '<rootDir>/src/app/core/$1',
    '@assets/(.*)': '<rootDir>/src/assets/$1',
    '@env': '<rootDir>/src/environments/environment',
  },
  transformIgnorePatterns: ['node_modules/(?!(jest-test))'],
  globals: {
    'ts-jest': {
      ...tsJestPreset,
      tsConfig: 'src/tsconfig.spec.json',
    }
  }
};
