export class AWSAvailabilityZone {
  name: string;
}

export class AWSSubnet {
  name: string;
  id: string;
  availability_zone: string;
  availability_zone_id: string;
  ipv4cidr: string;
  ipv6cidr: string;
  tags: AWSSubnetTags[];
  state: string;
  available_ip_address_count: number;
  default: boolean;
}

export class AWSSubnetTags {
  key: string;
  value: string;
}
