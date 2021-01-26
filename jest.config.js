const tsJestPreset = require('jest-preset-angular/jest-preset').globals[
  'ts-jest'
];

module.exports = {
  preset: 'jest-preset-angular',
  roots: ['src/app'],
  setupFilesAfterEnv: ['<rootDir>/src/test.base.ts'],
  transformIgnorePatterns: ['node_modules/(?!(jest-test))'],
  globals: {
    'ts-jest': {
      ...tsJestPreset,
      tsconfig: 'src/tsconfig.spec.json',
    },
  },
  moduleNameMapper: {
    "^@shared/(.*)$": "<rootDir>/src/app/shared/$1",
    "^@core/(.*)$": "<rootDir>/src/app/core/$1",
    "^@app/(.*)$": "<rootDir>/src/app/$1",
    "^@assets/(.*)$": "<rootDir>/src/assets/$1",
    "^@environments/(.*)$": "<rootDir>/src/environments/$1"
  },
};
