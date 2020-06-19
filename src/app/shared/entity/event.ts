import {ObjectReference} from './common';

export class Event {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name?: string;
  message?: string;
  type?: string;
  involvedObject: ObjectReference;
  lastTimestamp: Date;
  count: number;
}
