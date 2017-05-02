export class MetadataEntity {
  name: any;
  revision: string;
  uid: string;

  constructor(name: any, revision: string, uid: string) {
    this.name = name;
    this.revision = revision;
    this.uid = uid;
  }
}
