export class PacketSize {
  name: string;
  cpus: PacketCPU[];
  memory: string;
  drives: PacketDrive[];
}

export class PacketDrive {
  count: number;
  size: string;
  type: string;
}

export class PacketCPU {
  count: number;
  type: string;
}
