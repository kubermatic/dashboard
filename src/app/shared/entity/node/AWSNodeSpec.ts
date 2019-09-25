export class AWSNodeSpec {
  instanceType: string;
  diskSize: number;
  volumeType: string;
  ami: string;
  tags: object;
  subnetId: string;
  availabilityZone: string;
  assignPublicIP?: boolean;
}
