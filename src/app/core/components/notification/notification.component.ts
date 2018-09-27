import { Observable } from 'rxjs';
import { Component } from '@angular/core';
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

  constructor(private _service: NotificationsService) {
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
          // TODO: This fallback should be removed once Clipboard API will be widely adopted:
          // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard#Browser_compatibility
          this.copyToClipboard(message);
        }
      });
    }
  }

  copyToClipboard(text: string) {
    const textarea = document.createElement('textarea');
    textarea.style.position = 'fixed';
    textarea.style.left = '0';
    textarea.style.top = '0';
    textarea.style.opacity = '0';
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

}
