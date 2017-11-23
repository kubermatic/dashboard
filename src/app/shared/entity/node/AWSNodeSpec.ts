export class AWSNodeSpec {
  root_size: number;
  instance_type: string;
  volume_type:   string;
  ami: string;

  constructor(instance_type: string, root_size: number, volume_type: string, ami: string) {
    this.instance_type = instance_type;
    this.root_size = root_size;
    this.volume_type = volume_type;
    this.ami = ami;
  }
}
