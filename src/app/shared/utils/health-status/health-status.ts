export enum HealthStatusColor {
  Green = 'fa fa-circle green',
  Orange = 'fa fa-spin fa-circle-o-notch orange',
  Red = 'fa fa-spin fa-circle-o-notch red',
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
