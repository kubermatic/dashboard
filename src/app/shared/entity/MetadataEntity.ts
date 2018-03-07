export class MetadataEntity {
  name: string;
  selfLink: string;
  uid: string;
  annotations: Map<string, string>;
  creationTimestamp: Date;
  labels: Map<string, string>;
}

export class MetadataEntityV2 {
  name: string;
  displayName: string;
  deletionTimestamp: Date;
  annotations: Map<string, string>;
  labels: Map<string, string>;
}
