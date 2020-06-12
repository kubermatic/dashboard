import {UserSettings} from './settings';

export class Member {
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

export class CreateMember {
  email: string;
  projects: MemberProject[];
}

export class Admin {
  name?: string;
  email?: string;
  isAdmin?: boolean;
}
