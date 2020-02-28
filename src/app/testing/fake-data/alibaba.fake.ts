import {AlibabaInstanceType} from '../../shared/entity/provider/alibaba/Alibaba';

export function fakeAlibabaInstanceTypes(): AlibabaInstanceType[] {
  return [
    {'id': 'ecs.s2.small', 'cpuCoreCount': 2, 'memorySize': 2},
    {'id': 'ecs.s3.medium', 'cpuCoreCount': 4, 'memorySize': 4},
    {'id': 'ecs.c1.small', 'cpuCoreCount': 8, 'memorySize': 8},
    {'id': 'ecs.c2.medium', 'cpuCoreCount': 16, 'memorySize': 16},
    {'id': 'ecs.s1.small', 'cpuCoreCount': 1, 'memorySize': 2},
  ];
}
