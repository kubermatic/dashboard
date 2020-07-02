import * as version from '../../assets/config/version.json';

export function getEditionDirName() {
  return version.edition === 'Community Edition' ? 'community' : 'enterprise';
}
