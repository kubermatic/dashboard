export class AWSCloudSpec {
  access_key_id: string;
  secret_access_key: string;
  vpc_id: string;
  ssh_key_name: string;
  subnet_id: string;
  internet_gateway_id: string;
  route_table_id: string;

  constructor(access_key_id: string, secret_access_key: string, vpc_id: string, ssh_key_name: string, subnet_id: string, internet_gateway_id: string, route_table_id: string) {
    this.access_key_id = access_key_id;
    this.secret_access_key = secret_access_key;
    this.vpc_id = vpc_id;
    this.ssh_key_name = ssh_key_name;
    this.subnet_id = subnet_id;
    this.internet_gateway_id = internet_gateway_id;
    this.route_table_id = route_table_id;
  }
}
