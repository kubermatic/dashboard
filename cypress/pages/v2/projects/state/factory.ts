import {MockedProjectState} from './mocked';
import {RealProjectState} from './real';
import {ProjectState} from './types';

export class ProjectStateFactory {
  static new(isAPIMocked: boolean): ProjectState {
    return isAPIMocked ? new MockedProjectState() : new RealProjectState();
  }
}
