export class AWSNodeSpec {
  instanceType: string;
  diskSize: number;
  volumeType: string;
  ami: string;
  tags: Map<string, string>;
}
