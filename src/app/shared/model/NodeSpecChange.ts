import { NodeCloudSpec, NodeEntity } from '../entity/NodeEntity';

export class NodeData {
  node?: NodeEntity;
  count?: number;
  valid?: boolean;
}

export class NodeProviderData {
  spec?: NodeCloudSpec;
  valid?: boolean;
}
