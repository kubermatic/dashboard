import { VSphereNetwork } from '../../shared/entity/provider/vsphere/VSphereEntity';

export function fakeVSphereNetworks(): VSphereNetwork[] {
  return [
    {
      name: 'fake vsphere network',
    },
    {
      name: 'another fake vsphere network',
    },
  ];
}
