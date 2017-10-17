import {MetadataEntity} from "./MetadataEntity";

export class SSHKeyEntity {
  metadata: MetadataEntity;
  spec: SSHKeySpec;

  constructor(name: string, fingerprint: string, publicKey: string) {
    this.spec = new SSHKeySpec(name, fingerprint, publicKey);
  }
}

export class SSHKeySpec {
  name: string;
  fingerprint: string;
  publicKey: string;
  clusters: string[];

  constructor(name: string, fingerprint: string, publicKey: string) {
    this.name = name;
    this.fingerprint = fingerprint;
    this.publicKey = publicKey;
  }
}
