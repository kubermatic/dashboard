import { Observable } from 'rxjs/Observable';
import { Component } from '@angular/core';
import { NotificationsService } from 'angular2-notifications';
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
    timeOut: 5000,
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
    switch (toast.type) {
      case NotificationToastType.success:
        this._service.success(toast.title, toast.content);
        break;
      case NotificationToastType.alert:
        this._service.alert(toast.title, toast.content);
        break;
      case NotificationToastType.error:
        this._service.error(toast.title, toast.content);
        break;
      case NotificationToastType.info:
        this._service.info(toast.title, toast.content);
        break;
    }
  }

}
