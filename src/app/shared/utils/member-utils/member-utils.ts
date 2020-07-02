import {MemberEntity} from '../../entity/MemberEntity';
import {GroupConfig} from '../../model/Config';

export enum Permission {
  View = 'view',
  Create = 'create',
  Edit = 'edit',
  Delete = 'delete',
}

export enum Group {
  Owner = 'owners',
  Editor = 'editors',
  Viewer = 'viewers',
}

export class MemberUtils {
  static getGroupInProject(member: MemberEntity, projectID: string): string {
    const project = member.projects.find(memberProject => memberProject.id === projectID);
    return project ? project.group : '';
  }

  static getGroupDisplayName(groupInternalName: string): string {
    switch (groupInternalName) {
      case Group.Owner:
        return 'Owner';
      case Group.Editor:
        return 'Editor';
      case Group.Viewer:
        return 'Viewer';
      default:
        return '';
    }
  }

  static hasPermission(
    member: MemberEntity,
    groupConfig: GroupConfig,
    viewName: string,
    permission: Permission
  ): boolean {
    // Deny access if the user is invalid.
    if (!member) {
      return false;
    }

    // Allow access if the user has administrator privileges.
    if (member.isAdmin) {
      return true;
    }

    // Allow access if the access configuration is missing.
    if (!groupConfig || !groupConfig[viewName]) {
      return true;
    }

    // Check the access permission in the access configuration.
    return groupConfig[viewName][permission];
  }
}
