const {gitDescribeSync} = require('git-describe');
const {resolve} = require('path');
const {writeFileSync} = require('fs');

function getEditionDisplayName() {
  return process.env.KUBERMATIC_EDITION === 'ce'
    ? 'Community Edition'
    : 'Enterprise Edition';
}

const gitInfo = gitDescribeSync({
  dirtyMark: false,
  dirtySemver: false,
});

// Append edition information
gitInfo.edition = getEditionDisplayName();

const versionInfoJson = JSON.stringify(gitInfo, null, 2);

// eslint-disable-next-line no-console
console.log(versionInfoJson + '\n');

writeFileSync(
  resolve(__dirname, 'src', 'assets', 'config', 'version.json'),
  versionInfoJson
);
