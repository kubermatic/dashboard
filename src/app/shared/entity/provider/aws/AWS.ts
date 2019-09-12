export class AWSSubnet {
  name: string;
  id: string;
  availability_zone: string;
  availability_zone_id: string;
  ipv4cidr: string;
  ipv6cidr: string;
  tags: AWSTags[];
  state: string;
  available_ip_address_count: number;
  default: boolean;
}

export class AWSTags {
  key: string;
  value: string;
}

export class AWSVPC {
  vpcId: string;
  name: string;
  cidrBlock: string;
  cidrBlockAssociationSet: AWSCidrBlockSet[];
  dhcpOptionsId: string;
  instanceTenancy: string;
  ipv6CidrBlockAssociationSet: AWSCidrBlockSet[];
  isDefault: boolean;
  ownerId: string;
  state: string;
  tags: AWSTags[];
}

export class AWSCidrBlockSet {
  associationId: string;
  cidrBlock: string;
  state: string;
  statusMessage: string;
}

export class AWSSize {
  name: string;
  pretty_name: string;
  memory: number;
  vcpus: number;
  price: number;
}
