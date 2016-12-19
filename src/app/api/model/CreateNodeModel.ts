import {NodeSpec} from '../entitiy/NodeEntity';
export class CreateNodeModel {

  instances: number;
  spec: NodeSpec;

  constructor(instances: number, spec: NodeSpec) {
    this.instances = instances;
    this.spec = spec;
  }
}
