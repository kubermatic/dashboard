export class EventEntity {
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

export class ObjectReference {
  name: string;
  namespace: string;
  kind: string;
}
