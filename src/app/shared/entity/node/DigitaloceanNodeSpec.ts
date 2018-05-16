export class DigitaloceanNodeSpec {
  size: string;
  backups: boolean;
  ipv6: boolean;
  monitoring: boolean;
  tags: string[];
}

export class DigitaloceanOptions {
  backups: boolean;
  ipv6: boolean;
  monitoring: boolean;
  tags: string[];
}
