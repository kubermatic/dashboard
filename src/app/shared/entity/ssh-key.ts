export class SSHKeyEntity {
  creationTimestamp: Date;
  deletionTimestamp: Date;
  id: string;
  name: string;
  spec: SSHKeySpec;

  constructor(name: string, fingerprint: string, publicKey: string) {
    this.name = name;
    this.spec = {
      fingerprint,
      publicKey,
    };
  }
}

export class SSHKeySpec {
  fingerprint: string;
  publicKey: string;
}
