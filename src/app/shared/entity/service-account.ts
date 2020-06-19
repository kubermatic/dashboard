export class ServiceAccount {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  group: string;
  status: string;
}

export class ServiceAccountModel {
  name: string;
  group: string;
}

export class ServiceAccountToken {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  expiry: Date;
  id: string;
  name: string;
  token?: string;
}

export class CreateTokenEntity {
  name: string;
}

export class ServiceAccountTokenPatch {
  name: string;
}
