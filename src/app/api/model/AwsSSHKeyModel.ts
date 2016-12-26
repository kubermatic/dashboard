export class AwsSSHKey {
  KeyName: string;
  KeyFingerprint: string;

  constructor(KeyName: string) {
    this.KeyName = KeyName;
  }
}
