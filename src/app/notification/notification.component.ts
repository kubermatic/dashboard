import { Component, OnInit } from "@angular/core";
import { NotificationsService } from "angular2-notifications";
import {Store} from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {NotificationToast, NotificationToastType} from "../reducers/notification";
import {Actions} from "../reducers/actions";

@Component({
  selector: "kubermatic-notification",
  templateUrl: "./notification.component.html",
  styleUrls: ["./notification.component.scss"]
})
export class NotificationComponent {

  public options = {
    timeOut: 5000,
    theClass: "custom-simple-notification",
    lastOnBottom: true,
    clickToClose: true,
    showProgressBar: true,
    pauseOnHover: true,
    preventDuplicates: false,
    preventLastDuplicates: "visible",
    position: ["right", "top"]
  };

  public static success(store: Store<fromRoot.State>, title: string, content: string) {
    return store.dispatch({ type: Actions.PUSH_NOTIFICATION, payload: {
      toast: <NotificationToast>{
        type: NotificationToastType.success,
        title: title,
        content: content
      }
    }
    });
  }

  public static alert(store: Store<fromRoot.State>, title: string, content: string) {
    return store.dispatch({ type: Actions.PUSH_NOTIFICATION, payload: {
      toast: <NotificationToast>{
        type: NotificationToastType.alert,
        title: title,
        content: content
      }
    }
    });
  }

  public static info(store: Store<fromRoot.State>, title: string, content: string) {
    return store.dispatch({ type: Actions.PUSH_NOTIFICATION, payload: {
      toast: <NotificationToast>{
        type: NotificationToastType.info,
        title: title,
        content: content
      }
    }
    });
  }

  public static error(store: Store<fromRoot.State>, title: string, content: string) {
    return store.dispatch({ type: Actions.PUSH_NOTIFICATION, payload: {
      toast: <NotificationToast>{
        type: NotificationToastType.error,
        title: title,
        content: content
      }
    }
    });
  }

  constructor(private _store: Store<fromRoot.State>, private _service: NotificationsService) {
    this._store.select(fromRoot.getNotificationToast).subscribe(toast => {
      if (!!toast) {
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
