export enum HealthStatusColor {
  Green = 'km-icon-mask km-icon-circle km-success-bg',
  Orange = 'km-icon-mask km-icon-circle km-warning-bg',
  Red = 'km-icon-mask km-icon-circle km-error-bg',
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
