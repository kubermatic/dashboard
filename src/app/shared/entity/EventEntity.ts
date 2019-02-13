export class EventEntity {
  creationTimestamp?: Date;
  deletionTimestamp?: Date;
  id?: string;
  name?: string;
  message?: string;
  type?: string;
  involvedObjectName: string;
  lastTimestamp: Date;
  count: number;
}
