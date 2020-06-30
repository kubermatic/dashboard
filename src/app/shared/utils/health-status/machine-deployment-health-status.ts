import {MachineDeployment} from '../../entity/machine-deployment';
import {HealthStatus, HealthStatusColor, HealthStatusMessage} from './health-status';

export class MachineDeploymentHealthStatus extends HealthStatus {
  static getHealthStatus(md: MachineDeployment): MachineDeploymentHealthStatus {
    if (md.deletionTimestamp) {
      return new MachineDeploymentHealthStatus(HealthStatusMessage.Deleting, HealthStatusColor.Red);
    } else if (md.status && md.status.availableReplicas === md.spec.replicas) {
      return new MachineDeploymentHealthStatus(HealthStatusMessage.Running, HealthStatusColor.Green);
    } else if (md.status && md.status.updatedReplicas !== md.spec.replicas) {
      return new MachineDeploymentHealthStatus(HealthStatusMessage.Updating, HealthStatusColor.Orange);
    }
    return new MachineDeploymentHealthStatus(HealthStatusMessage.Provisioning, HealthStatusColor.Orange);
  }

  constructor(message: HealthStatusMessage, color: HealthStatusColor) {
    super(message, color);
  }
}
