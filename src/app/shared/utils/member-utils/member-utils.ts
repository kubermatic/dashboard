import {MemberEntity} from '../../entity/MemberEntity';

export class MemberUtils {
  static getGroupInProject(member: MemberEntity, projectID): string {
    return member.projects.find(memberProject => memberProject.id === projectID).group;
  }

  static getGroupDisplayName(group: string) {
    const prefix = group.split('-')[0];
    switch (prefix) {
      case 'owners':
        return 'Owner';
      case 'editors':
        return 'Editor';
      case 'viewers':
        return 'Viewer';
    }
    return '';
  }
}
