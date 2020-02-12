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

export class UserSettings {
  selectedTheme?: Theme;
  selectedProjectId?: string;
  itemsPerPage?: number;
  selectProjectTableView?: boolean;
  collapseSidenav?: boolean;
}

export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

export class MemberProject {
  group: string;
  id: string;
}

export class CreateMemberEntity {
  email: string;
  projects: MemberProject[];
}
