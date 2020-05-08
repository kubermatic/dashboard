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
      tsConfig: 'src/tsconfig.spec.json',
    },
  },
};
