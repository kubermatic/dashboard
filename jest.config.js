export default {
  preset: 'jest-preset-angular/presets/defaults',
  roots: ['src'],
  setupFilesAfterEnv: ['<rootDir>/src/test.base.ts'],
  globals: {
    'ts-jest': {
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
