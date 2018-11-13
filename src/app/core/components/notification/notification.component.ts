import {select} from '@angular-redux/store';
import {Component, ViewEncapsulation} from '@angular/core';
import {Notification, NotificationsService} from 'angular2-notifications';
import {Observable} from 'rxjs';
import {NotificationToast, NotificationToastType} from '../../../shared/interfaces/notification-toast.interface';

@Component({
  selector: 'kubermatic-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  providers: [NotificationsService],
  encapsulation: ViewEncapsulation.None,
})
export class NotificationComponent {
  private static readonly closeButtonClass = 'sn-close-button';
  private static readonly copyButtonClass = 'sn-copy-button';

  options = {
    timeOut: 10000,
    theClass: 'custom-simple-notification',
    lastOnBottom: true,
    clickToClose: false,
    showProgressBar: true,
    pauseOnHover: true,
    preventDuplicates: false,
    preventLastDuplicates: 'visible',
    position: ['right', 'top'],
  };

  @select(['notification', 'toast']) notification$: Observable<NotificationToast>;

  constructor(private _service: NotificationsService) {
    this.notification$.subscribe((toast) => {
      if (toast) {
        this.createToast(toast);
      }
    });
  }

  createToast(toast: NotificationToast): void {
    let notification: Notification;
    const plainMessage = `${toast.title}: ${toast.content}`;
    const htmlMessage = this.createHtmlMessage(toast);
    switch (toast.type) {
      case NotificationToastType.success:
        notification = this._service.success(toast.title, htmlMessage);
        break;
      case NotificationToastType.alert:
        notification = this._service.alert(toast.title, htmlMessage);
        break;
      case NotificationToastType.error:
        notification = this._service.error(toast.title, htmlMessage);
        break;
      case NotificationToastType.info:
        notification = this._service.info(toast.title, htmlMessage);
        break;
    }
    this.registerClickHandler(notification, plainMessage);
  }

  createHtmlMessage(toast: NotificationToast): string {
    return `${toast.content}<div class="sn-controls"><span class="${
        NotificationComponent.closeButtonClass}">Close</button>
    <span class="${NotificationComponent.copyButtonClass}">Copy to clipboard</button></div>`;
  }

  registerClickHandler(notification: Notification, plainMessage: string): void {
    if (notification) {
      notification.click.subscribe((e: MouseEvent) => {
        const targetId = (e.target as HTMLElement).className;
        if (targetId.indexOf(NotificationComponent.closeButtonClass) > -1) {
          this._service.remove(notification.id);
        }
        if (targetId.indexOf(NotificationComponent.copyButtonClass) > -1) {
          this.copyToClipboard(plainMessage);
        }
      });
    }
  }

  copyToClipboard(text: string): void {
    // TODO: Use navigator.clipboard instead of navigator['clipboard'] once TypeScript will support it.
    navigator['clipboard'].writeText(text);
  }
}
