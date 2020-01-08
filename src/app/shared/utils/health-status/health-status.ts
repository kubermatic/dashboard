export enum HealthStatusColor {
  Green = 'fa fa-circle km-green',
  Orange = 'fa fa-circle km-orange',
  Red = 'fa fa-circle km-red',
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
