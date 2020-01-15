import {Injectable} from '@angular/core';
import {MatSnackBar, MatSnackBarConfig} from '@angular/material/snack-bar';
import {NotificationComponent, NotificationType} from '../../components/notification/notification.component';

@Injectable()
export class NotificationService {
  private readonly _config: MatSnackBarConfig = {
    duration: 200000,
    horizontalPosition: 'end',
    verticalPosition: 'bottom',
    panelClass: 'km-notification',
  };

  constructor(private readonly _snackBar: MatSnackBar) {}

  private _open(message: string, type: NotificationType): void {
    const snackBarRef = this._snackBar.openFromComponent(NotificationComponent, this._config);

    snackBarRef.instance.message = message;
    snackBarRef.instance.snackBarRef = snackBarRef;
    snackBarRef.instance.type = type;
  }

  success(message: string): void {
    this._open(message, NotificationType.success);
  }

  error(message: string): void {
    this._open(message, NotificationType.error);
  }
}
