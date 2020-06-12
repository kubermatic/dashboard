import {ObjectReference} from '../../shared/entity/common';
import {Event} from '../../shared/entity/event';

export function fakeEvents(): Event[] {
  return [
    {
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
    } as Event,
  ];
}
