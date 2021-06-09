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

// Re-use the version logic from our Makefile
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
