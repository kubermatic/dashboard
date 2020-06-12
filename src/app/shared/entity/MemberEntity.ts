import {UserSettings} from './settings';

export class MemberEntity {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  email: string;
  isAdmin?: boolean;
  id: string;
  name: string;
  settings?: UserSettings;
  projects: MemberProject[];
}

export class MemberProject {
  group: string;
  id: string;
}

export class CreateMemberEntity {
  email: string;
  projects: MemberProject[];
}

export class AdminEntity {
  name?: string;
  email?: string;
  isAdmin?: boolean;
}
