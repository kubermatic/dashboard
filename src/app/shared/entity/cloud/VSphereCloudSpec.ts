export class VSphereCloudSpec {
  username: string;
  password: string;
  vmNetName: string;
  folder?: string;
  infraManagementUser: VSphereInfraManagementUser;
}

export class VSphereInfraManagementUser {
  username: string;
  password: string;
}
