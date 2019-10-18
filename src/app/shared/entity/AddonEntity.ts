export class AddonEntity {
  creationTimestamp: Date;
  deletionTimestamp?: Date;
  id: string;
  name: string;
  spec: AddonSpec;
}

export class AddonSpec {
  isDefault?: boolean;
  variables?: object;
}
