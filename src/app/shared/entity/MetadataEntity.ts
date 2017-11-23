export class MetadataEntity {
  name: string;
  selfLink: string;
  uid: string;
  annotations: Map<string, string>;
  creationTimestamp: Date;
  labels: Map<string, string>;
}
