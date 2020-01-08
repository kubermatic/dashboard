import {fakeInactiveProject, fakeProject} from '../../../testing/fake-data/project.fake';
import {HealthStatusColor} from '../health-status/health-status';

import {ProjectUtils} from './project-utils';

describe('ProjectUtils', () => {
  it('should get state of icon', () => {
    expect(ProjectUtils.getStateIconClass('Active')).toBe(HealthStatusColor.Green);
    expect(ProjectUtils.getStateIconClass('Inactive')).toBe(HealthStatusColor.Red);
    expect(ProjectUtils.getStateIconClass('Terminating')).toBe(HealthStatusColor.Orange);
    expect(ProjectUtils.getStateIconClass('')).toBe(HealthStatusColor.Orange);
  });

  it('should return if project is active', () => {
    expect(ProjectUtils.isProjectActive(fakeProject())).toBeTruthy();
    expect(ProjectUtils.isProjectActive(fakeInactiveProject())).toBeFalsy();
  });
});
