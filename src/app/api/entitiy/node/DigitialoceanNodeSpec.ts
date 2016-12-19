export class DigitaloceanNodeSpec {
  type: string;
  size: string;
  sshKeys: string[];

  constructor(type: string, size: string, sshKeys: string[]) {
    this.type = type;
    this.size = size;
    this.sshKeys = sshKeys;
  }
}
