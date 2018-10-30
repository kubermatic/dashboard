import { AzureSizes } from '../../shared/entity/provider/azure/AzureSizeEntity';
import { DigitaloceanSizes } from '../../shared/entity/provider/digitalocean/DropletSizeEntity';
import { OpenstackFlavor } from '../../shared/entity/provider/openstack/OpenstackSizeEntity';

export function fakeDigitaloceanSizes(): DigitaloceanSizes {
  return {
    standard: [
      {
        available: true,
        disk: 20,
        memory: 2,
        vcpus: 2,
        price_hourly: 2,
        price_monthly: 2,
        regions: ['sfo'],
        slug: 'test1',
        transfer: 1,
      }
    ],
    optimized: [],
  };
}

export function fakeOpenstackFlavors(): OpenstackFlavor[] {
  return [
    {
      vcpus: 1,
      disk: 50,
      isPublic: true,
      memory: 1024,
      region: 'os1',
      slug: 'tiny-m1',
      swap: 0,
    },
  ];
}

export function fakeAzureSizes(): AzureSizes[] {
  return [
    {
      name: 'Standard_A0',
      maxDataDiskCount: 1,
      memoryInMB: 768,
      numberOfCores: 1,
      osDiskSizeInMB: 1047552,
      resourceDiskSizeInMB: 20480,
    },
  ];
}
