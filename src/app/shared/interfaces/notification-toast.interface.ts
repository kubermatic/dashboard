export enum NotificationToastType {
    success,
    alert,
    error,
    info
}

export interface NotificationToast {
    type: NotificationToastType;
    title: string;
    content: string;
    icon?: string;
}
