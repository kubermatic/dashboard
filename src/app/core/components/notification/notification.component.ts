import {Component} from '@angular/core';
import {MatSnackBarRef} from '@angular/material/snack-bar';

export enum NotificationType {
  success,
  error
}

@Component({
  selector: 'kubermatic-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent {
  private _snackBarRef: MatSnackBarRef<NotificationComponent>;
  private _type: NotificationType;

  set snackBarRef(ref: MatSnackBarRef<NotificationComponent>) {
    this._snackBarRef = ref;
  }

  set type(type: NotificationType) {
    this._type = type;
    this._init();
  }

  message: string;
  typeIconBackground: string;
  typeIconClassName: string;

  private _init(): void {
    switch (this._type) {
      case NotificationType.success:
        this.typeIconBackground = 'success';
        this.typeIconClassName = 'km-icon-tick';
        break;
      case NotificationType.error:
        this.typeIconBackground = 'error';
        this.typeIconClassName = 'km-icon-warning';
    }
  }

  dismiss(): void {
    this._snackBarRef.dismiss();
  }

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.message);
  }
}
