import {InjectionToken} from '@angular/core';

export enum NodeDataMode {
  Wizard,
  Dialog,
}

// Configures internal behavior of Node Data module.
export interface NodeDataConfig {
  // Defines internal behavior when getting data. Based on mode it uses different endpoints to
  // get information from the API.
  mode: NodeDataMode;
}

export const NODE_DATA_CONFIG = new InjectionToken<NodeDataConfig>('kubermatic.node.data.config');
