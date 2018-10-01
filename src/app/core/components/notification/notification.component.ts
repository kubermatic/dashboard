import { Observable } from 'rxjs';
import { Component } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { NotificationsService, Notification } from 'angular2-notifications';
import { NotificationToast, NotificationToastType } from '../../../shared/interfaces/notification-toast.interface';
import { select } from '@angular-redux/store';

@Component({
  selector: 'kubermatic-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  providers: [NotificationsService]
})
export class NotificationComponent {

  public options = {
    timeOut: 10000,
    theClass: 'custom-simple-notification',
    lastOnBottom: true,
    clickToClose: true,
    showProgressBar: true,
    pauseOnHover: true,
    preventDuplicates: false,
    preventLastDuplicates: 'visible',
    position: ['right', 'top']
  };

  @select(['notification', 'toast']) notification$: Observable<NotificationToast>;

  constructor(private _service: NotificationsService, private _clipboard: ClipboardService) {
    this.notification$.subscribe(toast => {
      if (toast) {
        this.createToast(toast);
      }
    });
  }

  createToast(toast: NotificationToast) {
    let notification: Notification;
    switch (toast.type) {
      case NotificationToastType.success:
        notification = this._service.success(toast.title, toast.content);
        break;
      case NotificationToastType.alert:
        notification = this._service.alert(toast.title, toast.content);
        break;
      case NotificationToastType.error:
        notification = this._service.error(toast.title, toast.content);
        break;
      case NotificationToastType.info:
        notification = this._service.info(toast.title, toast.content);
        break;
    }
    this.registerClickHandler(notification);
  }

  registerClickHandler(notification: Notification) {
    if (notification) {
      const message = `${notification.title}: ${notification.content}`;
      notification.click.subscribe(() => {
        // TODO: Use navigator.clipboard instead of navigator['clipboard'] once TypeScript will support it.
        if (navigator['clipboard']) {
          navigator['clipboard'].writeText(message);
        } else {
          // TODO: This fallback can be removed once Clipboard API will be widely adopted:
          // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard#Browser_compatibility
          this._clipboard.copyFromContent(message);
        }
      });
    }
  }
}
