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

const gtsConfig = require('gts/.prettierrc.json')
const _ = require('lodash')

const modifiedConfig = _.merge(
  {},
  gtsConfig,
  {
    // Print semicolons at the ends of statements.
    semi: true,
    // Include parentheses around a sole arrow function parameter (x => x).
    arrowParens: 'avoid',
    bracketSameLine: true,
    bracketSpacing: false,
    requirePragma: true,
    singleQuote: true,
    trailingComma: "all",
    endOfLine: "lf",
    // Specify the line length that the printer will wrap on.
    printWidth: 120,
  }
)

module.exports = modifiedConfig
