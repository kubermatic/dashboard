export class AddonEntity {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name: string;
  spec?: AddonSpec;
}

export class AddonSpec {
  isDefault?: boolean;
  variables?: object;
}

export class AddonConfigEntity {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name: string;
  spec: AddonConfigSpec;
}

export class AddonConfigSpec {
  description: string;
  logo: string;
  logoFormat: string;
  formSpec: AddonFormSpec[];
}

export class AddonFormSpec {
  displayName: string;
  internalName: string;
  required: boolean;
  type: string;
}
