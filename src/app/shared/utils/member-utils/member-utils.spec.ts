import {fakeMember} from '../../../testing/fake-data/member.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {MemberUtils} from './member-utils';

describe('MemberUtils', () => {
  it('should get group in project', () => {
    expect(MemberUtils.getGroupInProject(fakeMember(), fakeProject().id)).toBe('owners');
  });

  it('should get group display name', () => {
    expect(MemberUtils.getGroupDisplayName('owners')).toBe('Owner');
    expect(MemberUtils.getGroupDisplayName('editors')).toBe('Editor');
    expect(MemberUtils.getGroupDisplayName('viewers')).toBe('Viewer');
  });
});
