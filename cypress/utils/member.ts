import {ClustersPage} from "../pages/clusters.po";
import {MembersPage} from "../pages/members.po";

export enum Group {
    Owner = 'Owner',
    Editor = 'Editor',
    Viewer = 'Viewer',
}

export function reloadUsers(): void {
  MembersPage.waitForRefresh();
  ClustersPage.visit();
  MembersPage.visit();
}
