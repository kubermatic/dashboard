import {VersionInfo} from '../../shared/entity/VersionInfo';

export function fakeVersionInfo(): VersionInfo {
  return {
    dirty: true,
    distance: 10,
    hash: '1234abcd',
    raw: 'v1.0.0',
    semverString: 'v1.0.0',
    suffix: '',
    tag: 'v1.0.0',
  } as VersionInfo;
}