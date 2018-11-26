import {dispatch} from '@angular-redux/store';
import {Action} from '../../shared/interfaces/action.interface';
import {NotificationToast, NotificationToastType} from '../../shared/interfaces/notification-toast.interface';
import {ActionBase} from './action.base';

export class NotificationActions extends ActionBase {
  static readonly className: string = 'NotificationActions';
  static readonly PUSH_NOTIFICATION = NotificationActions.getActType('PUSH_NOTIFICATION');

  @dispatch()
  static success(title: string, content: string): Action {
    return {
      type: NotificationActions.PUSH_NOTIFICATION,
      payload: {
        toast: {
          type: NotificationToastType.success,
          title,
          content,
        } as NotificationToast,
      },
    };
  }

  @dispatch()
  static alert(title: string, content: string): Action {
    return {
      type: NotificationActions.PUSH_NOTIFICATION,
      payload: {
        toast: {
          type: NotificationToastType.alert,
          title,
          content,
        } as NotificationToast,
      },
    };
  }

  @dispatch()
  static info(title: string, content: string): Action {
    return {
      type: NotificationActions.PUSH_NOTIFICATION,
      payload: {
        toast: {
          type: NotificationToastType.info,
          title,
          content,
        } as NotificationToast,
      },
    };
  }

  @dispatch()
  static error(title: string, content: string): Action {
    return {
      type: NotificationActions.PUSH_NOTIFICATION,
      payload: {
        toast: {
          type: NotificationToastType.error,
          title,
          content,
        } as NotificationToast,
      },
    };
  }
}
