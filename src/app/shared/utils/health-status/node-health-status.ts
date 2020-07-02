import {Node} from '../../entity/node';

import {HealthStatus, HealthStatusColor, HealthStatusMessage} from './health-status';

export enum HealthStatusCss {
  Deleting = 'km-status-deleting',
  Failed = 'km-status-failed',
  Running = 'km-status-running',
  Provisioning = 'km-status-waiting',
}

export class NodeHealthStatus extends HealthStatus {
  static getHealthStatus(n: Node): NodeHealthStatus {
    if (n.deletionTimestamp) {
      return new NodeHealthStatus(HealthStatusMessage.Deleting, HealthStatusColor.Red, HealthStatusCss.Deleting);
    } else if (n.status.errorMessage) {
      return new NodeHealthStatus(HealthStatusMessage.Failed, HealthStatusColor.Red, HealthStatusCss.Failed);
    } else if (n.status.nodeInfo.kubeletVersion) {
      return new NodeHealthStatus(HealthStatusMessage.Running, HealthStatusColor.Green, HealthStatusCss.Running);
    }
    return new NodeHealthStatus(
      HealthStatusMessage.Provisioning,
      HealthStatusColor.Orange,
      HealthStatusCss.Provisioning
    );
  }

  css: string;

  constructor(message: HealthStatusMessage, color: HealthStatusColor, css: string) {
    super(message, color);
    this.css = css;
  }
}
