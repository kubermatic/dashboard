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
  private static readonly closeButtonClass = 'close-button';

  options = {
    timeOut: 10000,
    theClass: 'km-notification',
    lastOnBottom: true,
    clickToClose: false,
    showProgressBar: false,
    pauseOnHover: true,
    preventDuplicates: false,
    preventLastDuplicates: 'visible',
    position: ['right', 'bottom'],
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
    const htmlMessage = this.createHtmlMessage(toast);
    switch (toast.type) {
      case NotificationToastType.success:
        notification = this._service.success(htmlMessage);
        break;
      case NotificationToastType.error:
        notification = this._service.error(htmlMessage);
        break;
    }

    this.registerClickHandler(notification);
  }

  createHtmlMessage(toast: NotificationToast): string {
    let typeClass = '';
    let typeIcon = '';
    switch (toast.type) {
      case NotificationToastType.success:
        typeClass = 'success';
        typeIcon = 'km-icon-tick';
        break;
      case NotificationToastType.error:
        typeClass = 'error';
        typeIcon = 'km-icon-warning';
        break;
    }

    const contentClass = toast.content.length > 64 ? 'small' : '';

    return `<div class="km-notification-type ${typeClass}"><i class="${typeIcon}"></i></div>
      <div class="km-notification-content ${contentClass}">${toast.content}</div>
      <div class="km-notification-close-button">
        <button class="km-icon-close ${NotificationComponent.closeButtonClass}"></button>
      </div>`;
  }

  registerClickHandler(notification: Notification): void {
    if (notification) {
      notification.click.subscribe((e: MouseEvent) => {
        if ((e.target as HTMLElement).className.indexOf(NotificationComponent.closeButtonClass) > -1) {
          this._service.remove(notification.id);
        }
      });
    }
  }
}
