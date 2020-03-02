import {AlibabaInstanceType} from '../../shared/entity/provider/alibaba/Alibaba';

export function fakeAlibabaInstanceTypes(): AlibabaInstanceType[] {
  return [
    {'id': 'ecs.c4.2xlarge'},
    {'id': 'ecs.c4.3xlarge'},
    {'id': 'ecs.c4.xlarge'},
    {'id': 'ecs.c5.2xlarge'},
    {'id': 'ecs.c5.3xlarge'},
    {'id': 'ecs.c5.large'},
    {'id': 'ecs.c5.xlarge'},
    {'id': 'ecs.c6.2xlarge'},
    {'id': 'ecs.c6.3xlarge'},
    {'id': 'ecs.c6.large'},
    {'id': 'ecs.c6.xlarge'},
  ];
}
