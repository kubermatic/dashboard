import {dispatch} from '@angular-redux/store';
import {Action} from '../../shared/interfaces/action.interface';
import {NotificationToast, NotificationToastType} from '../../shared/interfaces/notification-toast.interface';
import {ActionBase} from './action.base';

export class NotificationActions extends ActionBase {
  static readonly className: string = 'NotificationActions';
  static readonly PUSH_NOTIFICATION = NotificationActions.getActType('PUSH_NOTIFICATION');

  @dispatch()
  static success(content: string): Action {
    return {
      type: NotificationActions.PUSH_NOTIFICATION,
      payload: {
        toast: {
          type: NotificationToastType.success,
          content,
        } as NotificationToast,
      },
    };
  }

  @dispatch()
  static error(content: string): Action {
    return {
      type: NotificationActions.PUSH_NOTIFICATION,
      payload: {
        toast: {
          type: NotificationToastType.error,
          content,
        } as NotificationToast,
      },
    };
  }
}
