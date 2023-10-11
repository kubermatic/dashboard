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

import gitDescribe from 'git-describe';
import {resolve, dirname} from 'path';
import {writeFileSync} from 'fs';
import {execSync} from 'child_process';
import {fileURLToPath} from 'url';

function getEditionDisplayName() {
  return process.env.KUBERMATIC_EDITION === 'ce'
    ? 'Community Edition'
    : 'Enterprise Edition';
}

const gitInfo = gitDescribe.gitDescribeSync({
  dirtyMark: false,
  dirtySemver: false,
});

// Append edition information
gitInfo.edition = getEditionDisplayName();

// Reuse the version logic from our Makefile
gitInfo.humanReadable = execSync("make version --no-print-directory").toString().trim();

// Append date information
gitInfo.date = new Date().toDateString();

const versionInfoJson = JSON.stringify(gitInfo, null, 2);

// eslint-disable-next-line no-console
console.log(versionInfoJson + '\n');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

writeFileSync(
  resolve(__dirname, 'src', 'assets', 'config', 'version.json'),
  versionInfoJson
);
