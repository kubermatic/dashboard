import {ClustersPage} from "../pages/clusters.po";
import {MembersPage} from "../pages/members.po";
import {wait} from "./wait";

export enum Group {
    Owner = 'Owner',
    Editor = 'Editor',
    Viewer = 'Viewer',
}

export function reloadUsers() {
  wait('**/users', 'GET', 'listUsers');

  ClustersPage.visit();
  MembersPage.visit();
}
