export class AWSCloudSpec {
  vpc_id: string;
  subnet_id: string;
  container_linux: AWSContainerLinux;

  constructor( vpc_id: string, subnet_id: string, container_linux: AWSContainerLinux) {
    this.vpc_id = vpc_id;
    this.subnet_id = subnet_id;
    this.container_linux = container_linux;

  }
}

export class AWSContainerLinux {
  auto_update: boolean;

  constructor(auto_update: boolean) {
    this.auto_update = auto_update;
  }
}


