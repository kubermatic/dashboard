import {nodeDeploymentsFake} from '../../../testing/fake-data/node.fake';

import {HealthStatusColor, HealthStatusMessage} from './health-status';
import {NodeDeploymentHealthStatus} from './node-deployment-health-status';

describe('NodeDeploymentHealthStatus', () => {
  it('should return correct status for node deployments', () => {
    const nds = nodeDeploymentsFake();

    expect(NodeDeploymentHealthStatus.getHealthStatus(nds[0])).toEqual(
      new NodeDeploymentHealthStatus(HealthStatusMessage.Running, HealthStatusColor.Green)
    );
    expect(NodeDeploymentHealthStatus.getHealthStatus(nds[1])).toEqual(
      new NodeDeploymentHealthStatus(HealthStatusMessage.Provisioning, HealthStatusColor.Orange)
    );
  });
});
