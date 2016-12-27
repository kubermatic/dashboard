export class SSHKey {
  KeyName: string;
  KeyFingerprint: string;

  constructor(KeyName: string, KeyFingerprint: string) {
    this.KeyName = KeyName;
    this.KeyFingerprint = KeyFingerprint;
  }
}
