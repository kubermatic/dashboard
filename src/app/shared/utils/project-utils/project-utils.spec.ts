import {fakeInactiveProject, fakeProject} from '../../../testing/fake-data/project.fake';
import {ProjectUtils} from './project-utils';

describe('ProjectUtils', () => {
  it('should get state of icon', () => {
    expect(ProjectUtils.getStateIconClass('Active')).toBe('fa fa-circle green');
    expect(ProjectUtils.getStateIconClass('Inactive')).toBe('fa fa-circle red');
    expect(ProjectUtils.getStateIconClass('Terminating')).toBe('fa fa-circle orange');
    expect(ProjectUtils.getStateIconClass('')).toBe('fa fa-circle orange');
  });

  it('should return if project is active', () => {
    expect(ProjectUtils.isProjectActive(fakeProject())).toBeTruthy();
    expect(ProjectUtils.isProjectActive(fakeInactiveProject())).toBeFalsy();
  });
});
