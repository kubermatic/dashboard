export class AWSCloudSpec {
  access_key_id: string;
  secret_access_key: string;
  vpc_id: string;
  subnet_id: string;
  route_table_id: string;
  security_group: string;


  constructor(
  access_key_id: string,
  secret_access_key: string,
  vpc_id: string,
  subnet_id: string,
  route_table_id: string,
  security_group: string
  ) {
    this.access_key_id = access_key_id;
    this.secret_access_key = secret_access_key;
    this.vpc_id = vpc_id;
    this.subnet_id = subnet_id;
    this.route_table_id = route_table_id;
    this.security_group = security_group;
  }
}
