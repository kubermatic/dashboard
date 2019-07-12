import {ClusterEntity} from '../../entity/ClusterEntity';
import {HealthEntity, HealthState} from '../../entity/HealthEntity';

import {HealthStatus, HealthStatusColor, HealthStatusMessage} from './health-status';

export enum HealthStatusCss {
  Deleting = 'km-status-deleting',
  Failed = 'km-status-failed',
  Running = 'km-status-running',
  Provisioning = 'km-status-waiting',
}

export class ClusterHealthStatus extends HealthStatus {
  static getHealthStatus(c: ClusterEntity, h: HealthEntity): ClusterHealthStatus {
    if (!!c.deletionTimestamp) {
      return new ClusterHealthStatus(HealthStatusMessage.Deleting, HealthStatusColor.Red, HealthStatusCss.Deleting);
    } else if (
        !!h && HealthState.isUp(h.apiserver) && HealthState.isUp(h.scheduler) && HealthState.isUp(h.controller) &&
        HealthState.isUp(h.machineController) && HealthState.isUp(h.etcd)) {
      return new ClusterHealthStatus(HealthStatusMessage.Running, HealthStatusColor.Green, HealthStatusCss.Running);
    } else {
      return new ClusterHealthStatus(
          HealthStatusMessage.Provisioning, HealthStatusColor.Orange, HealthStatusCss.Provisioning);
    }
  }

  static isClusterRunning(c: ClusterEntity, h: HealthEntity): boolean {
    if (!!c.deletionTimestamp) {
      return false;
    } else if (!!h && h.apiserver) {
      return true;
    }
    return false;
  }

  css: string;

  constructor(message: HealthStatusMessage, color: HealthStatusColor, css: string) {
    super(message, color);
    this.css = css;
  }
}
