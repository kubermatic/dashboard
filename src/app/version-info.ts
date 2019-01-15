import {VersionInfo} from './shared/entity/VersionInfo';

export const versionInfo = (() => {
  try {
    // tslint:disable-next-line:no-var-requires
    return require('../../git-version.json') as VersionInfo;
  } catch {
    // In dev the file might not exist:
    return {dirty: false, tag: 'v0.0.0', hash: 'dev', distance: 0, semverString: '0.0.0+0.dev'};
  }
})();
