export class OpenStackDatacenterSpec {
  availability_zone: string;
  auth_url: string;

  constructor(availability_zone: string, auth_url: string) {
    this.availability_zone = availability_zone;
    this.auth_url = auth_url;
  }
}
