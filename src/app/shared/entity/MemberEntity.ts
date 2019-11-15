export class MemberEntity {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  email: string;
  id: string;
  name: string;
  settings?: UserSettings;
  projects: MemberProject[];
}

export class UserSettings {
  selectedTheme?: string;
  selectedProjectId?: string;
  itemsPerPage?: number;
  selectProjectTableView?: boolean;
}

export class MemberProject {
  group: string;
  id: string;
}

export class CreateMemberEntity {
  email: string;
  projects: MemberProject[];
}
