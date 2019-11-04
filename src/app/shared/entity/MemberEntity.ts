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
  selextedProjectId?: string;
  itemsPerPage?: number;
}

export class MemberProject {
  group: string;
  id: string;
}

export class CreateMemberEntity {
  email: string;
  projects: MemberProject[];
}
