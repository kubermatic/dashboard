export class ServiceAccountEntity {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  group: string;
  status: string;
}

export class CreateServiceAccountEntity {
  name: string;
  group: string;
}

export class ServiceAccountTokenEntity {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  token?: string;
}

export class CreateTokenEntity {
  name: string;
}
