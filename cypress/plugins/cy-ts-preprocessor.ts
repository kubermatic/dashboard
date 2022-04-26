// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import path from 'path';

const webpackOptions = {
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@kmtypes': path.resolve(__dirname, '../types'),
      '@intercept': path.resolve(__dirname, '../intercept'),
      '@pages': path.resolve(__dirname, '../pages'),
      '@utils': path.resolve(__dirname, '../utils'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'ts-loader',
            options: {configFile: 'cypress/tsconfig.e2e.json'},
          },
        ],
      },
    ],
  },
};

export const configuration = {webpackOptions};
