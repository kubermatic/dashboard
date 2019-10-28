export class AWSNodeSpec {
  instanceType: string;
  diskSize: number;
  volumeType: string;
  ami: string;
  tags: object;
  subnetID: string;
  availabilityZone: string;
  assignPublicIP?: boolean;
}
