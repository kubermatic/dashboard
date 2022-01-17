// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

export default {
  preset: 'jest-preset-angular',
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
