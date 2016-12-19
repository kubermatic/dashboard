export class DigitialoceanCloudSpec {
  token: string;
  sshKeys: string[];

  constructor(token: string, sshKeys: string[]) {
    this.token = token;
    this.sshKeys = sshKeys;
  }
}
