export class SSHKeyEntity {
  name: string;
  fingerprint: string;
  publicKey: string;

  constructor(name: string, fingerprint: string, publicKey: string) {
    this.name = name;
    this.fingerprint = fingerprint;
    this.publicKey = publicKey;
  }
}
