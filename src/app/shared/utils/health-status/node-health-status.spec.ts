import {nodesFake} from '../../../testing/fake-data/node.fake';

import {HealthStatusColor, HealthStatusMessage} from './health-status';
import {HealthStatusCss, NodeHealthStatus} from './node-health-status';

describe('NodeHealthStatus', () => {
  it('should return correct status for nodes', () => {
    const ns = nodesFake();

    expect(NodeHealthStatus.getHealthStatus(ns[0]))
        .toEqual(
            new NodeHealthStatus(HealthStatusMessage.Running, HealthStatusColor.Green, HealthStatusCss.Running),
            'should be correct for running node');
    expect(NodeHealthStatus.getHealthStatus(ns[1]))
        .toEqual(
            new NodeHealthStatus(
                HealthStatusMessage.Provisioning, HealthStatusColor.Orange, HealthStatusCss.Provisioning),
            'should be correct for provisioning node');
  });
});
