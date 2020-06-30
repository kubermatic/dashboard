import {machineDeploymentsFake} from '../../../testing/fake-data/node.fake';

import {HealthStatusColor, HealthStatusMessage} from './health-status';
import {MachineDeploymentHealthStatus} from './machine-deployment-health-status';

describe('MachineDeploymentHealthStatus', () => {
  it('should return correct status for machine deployments', () => {
    const mds = machineDeploymentsFake();

    expect(MachineDeploymentHealthStatus.getHealthStatus(mds[0])).toEqual(
      new MachineDeploymentHealthStatus(HealthStatusMessage.Running, HealthStatusColor.Green)
    );
    expect(MachineDeploymentHealthStatus.getHealthStatus(mds[1])).toEqual(
      new MachineDeploymentHealthStatus(HealthStatusMessage.Provisioning, HealthStatusColor.Orange)
    );
  });
});
