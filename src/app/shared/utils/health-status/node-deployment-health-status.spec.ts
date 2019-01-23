import {nodeDeploymentsFake} from '../../../testing/fake-data/node.fake';

import {HealthStatusColor, HealthStatusMessage} from './health-status';
import {NodeDeploymentHealthStatus} from './node-deployment-health-status';

describe('NodeDeploymentHealthStatus', () => {
  it('should return correct CSS classes', () => {
    const nds = nodeDeploymentsFake();

    expect(NodeDeploymentHealthStatus.getHealthStatus(nds[0]))
        .toEqual(
            {
              color: HealthStatusColor.Green,
              message: HealthStatusMessage.Running,
            } as NodeDeploymentHealthStatus,
            'should return classes for green icon');
    expect(NodeDeploymentHealthStatus.getHealthStatus(nds[1]))
        .toEqual(
            {
              color: HealthStatusColor.Orange,
              message: HealthStatusMessage.Provisioning,
            } as NodeDeploymentHealthStatus,
            'should return classes for orange icon');
  });
});
