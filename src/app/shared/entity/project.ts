export class Project {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  status: string;
  labels?: object;
  owners: ProjectOwners[];
  clustersNumber?: number;
}

export class ProjectOwners {
  creationTimestamp?: Date;
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
  labels?: object;
}
