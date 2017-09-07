export class ClusterNameEntity {
  valid: boolean;
  value: string;

  constructor(valid: boolean, value: string) {
    this.valid = valid;
    this.value = value;
  }
}
