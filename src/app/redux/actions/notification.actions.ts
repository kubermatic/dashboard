import { dispatch } from '@angular-redux/store';
import { Action } from '../../shared/interfaces/action.interface';
import { NotificationToast, NotificationToastType } from '../../shared/interfaces/notification-toast.interface';
import { ActionBase } from './action.base';

export class NotificationActions extends ActionBase {
  static readonly className: string = 'NotificationActions';
  static readonly PUSH_NOTIFICATION = NotificationActions.getActType('PUSH_NOTIFICATION');

  @dispatch()
  static success(title: string, content: string): Action {
    return {
      type: NotificationActions.PUSH_NOTIFICATION, payload: {
        toast: <NotificationToast> {
          type: NotificationToastType.success,
          title,
          content,
        },
      },
    };
  }

  @dispatch()
  static alert(title: string, content: string): Action {
    return {
      type: NotificationActions.PUSH_NOTIFICATION, payload: {
        toast: <NotificationToast> {
          type: NotificationToastType.alert,
          title,
          content,
        },
      },
    };
  }

  @dispatch()
  static info(title: string, content: string): Action {
    return {
      type: NotificationActions.PUSH_NOTIFICATION, payload: {
        toast: <NotificationToast> {
          type: NotificationToastType.info,
          title,
          content,
        },
      },
    };
  }

  @dispatch()
  static error(title: string, content: string): Action {
    return {
      type: NotificationActions.PUSH_NOTIFICATION, payload: {
        toast: <NotificationToast> {
          type: NotificationToastType.error,
          title,
          content,
        },
      },
    };
  }
}
