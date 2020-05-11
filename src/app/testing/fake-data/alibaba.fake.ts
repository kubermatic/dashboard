import {
  AlibabaInstanceType,
  AlibabaZone,
} from '../../shared/entity/provider/alibaba/Alibaba';

export function fakeAlibabaInstanceTypes(): AlibabaInstanceType[] {
  return [
    {id: 'ecs.c5.large', cpuCoreCount: 2, memorySize: 4},
    {id: 'ecs.c5.xlarge', cpuCoreCount: 4, memorySize: 8},
    {id: 'ecs.c5.2xlarge', cpuCoreCount: 8, memorySize: 16},
    {id: 'ecs.c5.4xlarge', cpuCoreCount: 16, memorySize: 32},
    {id: 'ecs.c5.6xlarge', cpuCoreCount: 24, memorySize: 48},
  ];
}

export function fakeAlibabaZones(): AlibabaZone[] {
  return [{id: 'eu-central-1a'}, {id: 'eu-central-1b'}];
}
