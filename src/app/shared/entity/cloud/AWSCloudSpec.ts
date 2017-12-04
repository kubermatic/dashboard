export class AWSCloudSpec {
  accessKeyId: string;
  secretAccessKey: string;
  vpcId: string;
  subnetId: string;
  routeTableId: string;
  securityGroup: string;

  constructor(
    accessKeyId: string,
    secretAccessKey: string,
    vpcId: string,
    subnetId: string,
    routeTableId: string,
    securityGroup: string
  ) {
    this.accessKeyId =   accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.vpcId = vpcId;
    this.subnetId = subnetId;
    this.routeTableId = routeTableId;
    this.securityGroup = securityGroup;
  }
}
