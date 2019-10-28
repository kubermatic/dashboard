export class CreateProjectModel {
  name: string;
  labels?: object;

  constructor(name: string, labels?: object) {
    this.name = name;
    this.labels = labels;
  }
}
