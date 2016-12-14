export class CreateNodeModel {

  instances: number;
  spec: NodeSpec;

  constructor(instances: number, spec: NodeSpec) {
    this.instances = instances;
    this.spec = spec;
  }
}

export class NodeSpec {

  dc: string;
  digitalocean: DigitaloceanNodeSpec;
  bringyourown: BringYourOwnNodeSpec;


  constructor(dc: string, digitalocean: DigitaloceanNodeSpec, bringyourown: BringYourOwnNodeSpec) {
    this.dc = dc;
    this.digitalocean = digitalocean;
    this.bringyourown = bringyourown;
  }
}

export class DigitaloceanNodeSpec {

  type: string;
  size: string;
  sshKeys: string[];

  constructor(type: string, size: string, sshKeys: string[]) {
    this.type = type;
    this.size = size;
    this.sshKeys = sshKeys;
  }
}


export class BringYourOwnNodeSpec {

}

