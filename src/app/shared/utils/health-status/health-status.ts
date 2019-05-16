export enum HealthStatusColor {
  Green = 'fa fa-circle green',
  Orange = 'fa fa-circle orange',
  Red = 'fa fa-circle red',
}

export enum HealthStatusMessage {
  Deleting = 'Deleting',
  Provisioning = 'Provisioning',
  Running = 'Running',
  Updating = 'Updating',
  Failed = 'Failed',
}

export class HealthStatus {
  message: HealthStatusMessage;
  color: HealthStatusColor;

  constructor(message: HealthStatusMessage, color: HealthStatusColor) {
    this.message = message;
    this.color = color;
  }
}
