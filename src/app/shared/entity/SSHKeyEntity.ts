
export class SSHKeySpec {
  fingerprint: string;
  publicKey: string;

  constructor(fingerprint: string, publicKey: string) {
    this.fingerprint = fingerprint;
    this.publicKey = publicKey;
  }
}

export class SSHKeyEntity {
  creationTimestamp: Date;
  deletionTimestamp: Date;
  id: string;
  name: string;
  spec: SSHKeySpec;

  constructor(name: string, fingerprint: string, publicKey: string) {
    this.name =  name;
    this.spec = new SSHKeySpec(fingerprint, publicKey);
  }
}
