export class MetadataEntity {
  name?: string;
  selfLink?: string;
  uid?: string;
  annotations?: Map<string, string>;
  creationTimestamp?: Date;
  labels?: Map<string, string>;
  deletionTimestamp?: Date;
}

export class MetadataEntityV2 {
  name?: string;
  displayName?: string;
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  annotations?: Map<string, string>;
  labels?: Map<string, string>;
}
