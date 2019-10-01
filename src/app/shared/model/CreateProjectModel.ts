export class CreateProjectModel {
  name: string;
  labels: object;

  constructor(name: string) {
    this.name = name;
  }
}
