export class ProjectEntity {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  status: string;
}

export class EditProjectEntity {
  name: string;
}
