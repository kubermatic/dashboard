import {NodeDeployment} from '../../entity/node-deployment';
import {HealthStatus, HealthStatusColor, HealthStatusMessage} from './health-status';

export class NodeDeploymentHealthStatus extends HealthStatus {
  static getHealthStatus(nd: NodeDeployment): NodeDeploymentHealthStatus {
    if (nd.deletionTimestamp) {
      return new NodeDeploymentHealthStatus(HealthStatusMessage.Deleting, HealthStatusColor.Red);
    } else if (nd.status && nd.status.availableReplicas === nd.spec.replicas) {
      return new NodeDeploymentHealthStatus(HealthStatusMessage.Running, HealthStatusColor.Green);
    } else if (nd.status && nd.status.updatedReplicas !== nd.spec.replicas) {
      return new NodeDeploymentHealthStatus(HealthStatusMessage.Updating, HealthStatusColor.Orange);
    }
    return new NodeDeploymentHealthStatus(HealthStatusMessage.Provisioning, HealthStatusColor.Orange);
  }

  constructor(message: HealthStatusMessage, color: HealthStatusColor) {
    super(message, color);
  }
}
