const {gitDescribeSync} = require('git-describe');
const {resolve} = require('path');
const {writeFileSync} = require('fs');

const gitInfo = gitDescribeSync({
  dirtyMark: false,
  dirtySemver: false,
});

const versionInfoJson = JSON.stringify(gitInfo, null, 2);

// eslint-disable-next-line no-console
console.log(versionInfoJson + '\n');

writeFileSync(
  resolve(__dirname, 'src', 'assets', 'config', 'git-version.json'),
  versionInfoJson
);
