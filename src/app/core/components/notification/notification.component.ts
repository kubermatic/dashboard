import { Observable } from 'rxjs';
import { Component } from '@angular/core';
import { ClipboardService } from 'ngx-clipboard';
import { NotificationsService, Notification, NotificationType } from 'angular2-notifications';
import { NotificationToast, NotificationToastType } from '../../../shared/interfaces/notification-toast.interface';
import { select } from '@angular-redux/store';

@Component({
  selector: 'kubermatic-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
  providers: [NotificationsService]
})
export class NotificationComponent {
  private static readonly closeButtonClass = 'sn-close-button';
  private static readonly copyButtonClass = 'sn-copy-button';

  public options = {
    timeOut: 10000,
    theClass: 'custom-simple-notification',
    lastOnBottom: true,
    clickToClose: false,
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
    return `${toast.content}<div class="sn-controls"><span class="${NotificationComponent.closeButtonClass}">Close</button>
    <span class="${NotificationComponent.copyButtonClass}">Copy to clipboard</button></div>`;
  }

  registerClickHandler(notification: Notification, plainMessage: string) {
    if (notification) {
      notification.click.subscribe((e: MouseEvent) => {
        const targetId = (<HTMLElement>e.target).className;
        if (targetId.indexOf( NotificationComponent.closeButtonClass) > -1) {
          this._service.remove(notification.id);
        }
        if (targetId.indexOf(NotificationComponent.copyButtonClass) > -1) {
          this.copyToClipboard(plainMessage);
        }
      });
    }
  }

  copyToClipboard(text: string) {
        // TODO: Use navigator.clipboard instead of navigator['clipboard'] once TypeScript will support it.
        if (navigator['clipboard']) {
      navigator['clipboard'].writeText(text);
        } else {
          // TODO: This fallback can be removed once Clipboard API will be widely adopted:
          // https://developer.mozilla.org/en-US/docs/Web/API/Clipboard#Browser_compatibility
      this._clipboard.copyFromContent(text);
    }
  }
}
