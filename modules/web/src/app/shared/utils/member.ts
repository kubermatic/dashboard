// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Member} from '../entity/member';
import {GroupConfig} from '../model/Config';

export enum Permission {
  View = 'view',
  Create = 'create',
  Edit = 'edit',
  Delete = 'delete',
}

export enum Group {
  Owner = 'owners',
  ProjectManager = 'projectmanagers',
  Editor = 'editors',
  Viewer = 'viewers',
}

export class MemberUtils {
  static getGroupInProject(member: Member, projectID: string): string {
    if (!member?.projects) return '';

    const priority = [Group.Owner, Group.ProjectManager, Group.Editor, Group.Viewer];

    const groups = member.projects.filter(p => p.id === projectID).map(p => p.group);
    if (member.isGlobalViewer) {
      groups.push(Group.Viewer);
    }
    return priority.find(role => groups.includes(role)) || '';
  }

  static getGroupDisplayName(groupInternalName: string): string {
    groupInternalName = Object.values(Group).find(g => groupInternalName.includes(g));

    switch (groupInternalName) {
      case Group.Owner:
        return 'Owner';
      case Group.ProjectManager:
        return 'Project Manager';
      case Group.Editor:
        return 'Editor';
      case Group.Viewer:
        return 'Viewer';
      default:
        return '';
    }
  }

  static hasPermission(member: Member, groupConfig: GroupConfig, viewName: string, permission: Permission): boolean {
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
