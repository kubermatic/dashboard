import {MetadataEntity} from "./MetadataEntity";

export class SSHKeyEntity {
  name: string;
  fingerprint: string;
  public_key: string;
  metadata: MetadataEntity

  constructor(name: string, fingerprint: string, publicKey: string) {
    this.name = name;
    this.fingerprint = fingerprint;
    this.public_key = publicKey;
  }
}
