import {environment} from '../../environments/environment';

export function getDynamicModulesRootPath() {
  return `src/app/dynamic/${environment.edition}`;
}
