export class DigitaloceanNodeSpec {
  size: string;
  backups: boolean;
  ipv6: boolean;
  monitoring: boolean;
  tags: string[];

  constructor(size: string, backups: boolean, ipv6: boolean, monitoring: boolean, tags: string[]) {
    this.size = size;
    this.backups = backups;
    this.ipv6 = ipv6;
    this.monitoring = monitoring;
    this.tags = tags;
  }
}
