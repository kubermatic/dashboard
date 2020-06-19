import {Cluster} from '../../entity/cluster';
import {Health, HealthState} from '../../entity/health';

import {HealthStatus, HealthStatusColor, HealthStatusMessage} from './health-status';

export enum HealthStatusCss {
  Deleting = 'km-status-deleting',
  Failed = 'km-status-failed',
  Running = 'km-status-running',
  Provisioning = 'km-status-waiting',
}

export class ClusterHealthStatus extends HealthStatus {
  static getHealthStatus(c: Cluster, h: Health): ClusterHealthStatus {
    if (c.deletionTimestamp) {
      return new ClusterHealthStatus(HealthStatusMessage.Deleting, HealthStatusColor.Red, HealthStatusCss.Deleting);
    } else if (this.isClusterRunning(c, h)) {
      return new ClusterHealthStatus(HealthStatusMessage.Running, HealthStatusColor.Green, HealthStatusCss.Running);
    }
    return new ClusterHealthStatus(
      HealthStatusMessage.Provisioning,
      HealthStatusColor.Orange,
      HealthStatusCss.Provisioning
    );
  }

  static isClusterRunning(c: Cluster, h: Health): boolean {
    return !!h && Health.allHealthy(h) && !c.deletionTimestamp;
  }

  static isClusterAPIRunning(c: Cluster, h: Health): boolean {
    return !!h && HealthState.isUp(h.apiserver) && !c.deletionTimestamp;
  }

  css: string;

  constructor(message: HealthStatusMessage, color: HealthStatusColor, css: string) {
    super(message, color);
    this.css = css;
  }
}
