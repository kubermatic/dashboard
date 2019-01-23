// This script runs operations *synchronously* which is normally not the best
// approach, but it keeps things simple, readable, and for now is good enough.

const {gitDescribeSync} = require('git-describe');
const {resolve} = require('path');
const {writeFileSync} = require('fs');

const gitInfo = gitDescribeSync({
  dirtyMark: false,
  dirtySemver: false
});

const versionInfoJson = JSON.stringify(gitInfo, null, 2);

console.log(versionInfoJson + '\n');

writeFileSync(resolve(__dirname, 'src', 'assets', 'config', 'git-version.json'), versionInfoJson);
