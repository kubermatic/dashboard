export class MetadataEntity {
  name: string;
  revision: string;
  uid: string;

  constructor(name: string, revision: string, uid: string) {
    this.name = name;
    this.revision = revision;
    this.uid = uid;
  }
}
