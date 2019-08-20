import {VSphereNetwork} from '../../shared/entity/provider/vsphere/VSphereEntity';

export function fakeVSphereNetworks(): VSphereNetwork[] {
  return [
    {
      'name': 'fake-network',
      'absolutePath': '/dc-1/network/fake-network',
      'relativePath': 'fake-network',
      'type': 'DistributedVirtualPortgroup'
    },
    {
      'name': 'another-fake-network',
      'absolutePath': '/dc-1/network/another-fake-network',
      'relativePath': 'another-fake-network',
      'type': 'DistributedVirtualPortgroup'
    },
  ];
}
