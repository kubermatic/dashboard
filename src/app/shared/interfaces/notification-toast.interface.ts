export enum NotificationToastType {
  success,
  error,
}

export interface NotificationToast {
  type: NotificationToastType;
  content: string;
}
