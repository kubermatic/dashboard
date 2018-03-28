import { NodeCreateSpec } from '../entity/NodeEntity';

export class CreateNodeModel {
  spec: NodeCreateSpec;

  constructor(spec: NodeCreateSpec) {
    this.spec = spec;
  }
}
