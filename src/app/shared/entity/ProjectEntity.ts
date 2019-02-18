export class ProjectEntity {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  status: string;
  owners: ProjectOwners[];
}

export class ProjectOwners {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  email: string;
  id?: string;
  name: string;
  projects?: OwnerProjects[];
}

export class OwnerProjects {
  group: string;
  id: string;
}

export class EditProjectEntity {
  name: string;
}
