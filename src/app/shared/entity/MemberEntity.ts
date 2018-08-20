export class MemberEntity {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  email: string;
  id: string;
  name: string;
  projects: MemberProject[];
}

export class MemberProject {
  group: string;
  id: string;
}

export class CreateMemberEntity {
  email: string;
  name: string;
  projects: MemberProject[];
}
