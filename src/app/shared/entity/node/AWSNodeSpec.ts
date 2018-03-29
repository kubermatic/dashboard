export class AWSNodeSpec {
  instanceType: string;
  diskSize: number;
  volumeType: string;
  ami: string;
  tags: Map<string, string>;

  constructor(instanceType: string, diskSize: number, volumeType: string, ami: string, tags: Map<string, string>) {
    this.instanceType = instanceType;
    this.diskSize = diskSize;
    this.volumeType = volumeType;
    this.ami = ami;
    this.tags = tags;
  }
}
