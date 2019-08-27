export class OpenstackNodeSpec {
  flavor: string;
  image: string;
  useFloatingIP: boolean;
  tags: object;
  diskSize?: number;
}
