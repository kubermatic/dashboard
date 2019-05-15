import {EventEntity, ObjectReference} from '../../shared/entity/EventEntity';

export function fakeEvents(): EventEntity[] {
  return [{
    id: 'event-1',
    count: 1,
    message: 'Test event',
    name: 'event-1',
    type: 'normal',
    involvedObject: {
      name: 'resource-1',
      namespace: 'namespace-a',
      type: 'Cluster',
    } as ObjectReference,
  } as EventEntity];
}
