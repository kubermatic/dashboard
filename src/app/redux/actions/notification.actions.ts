import { ActionBase } from './action.base';
import { Action } from '../../shared/interfaces/action.interface';

import { dispatch } from '@angular-redux/store';

import { NotificationToast, NotificationToastType } from '../reducers/notification';

export class NotificationActions extends ActionBase {
    static readonly className: string = 'NotificationActions';
    static readonly PUSH_NOTIFICATION = NotificationActions.getActType('PUSH_NOTIFICATION');

    @dispatch()
    static success(title: string, content: string): Action {
        return {
            type: NotificationActions.PUSH_NOTIFICATION, payload: {
                toast: <NotificationToast>{
                    type: NotificationToastType.success,
                    title: title,
                    content: content
                }
            }
        };
    }

    @dispatch()
    static alert(title: string, content: string) {
        return {
            type: NotificationActions.PUSH_NOTIFICATION, payload: {
                toast: <NotificationToast>{
                    type: NotificationToastType.alert,
                    title: title,
                    content: content
                }
            }
        };
    }

    @dispatch()
    static info(title: string, content: string) {
        return {
            type: NotificationActions.PUSH_NOTIFICATION, payload: {
                toast: <NotificationToast>{
                    type: NotificationToastType.info,
                    title: title,
                    content: content
                }
            }
        };
    }

    @dispatch()
    static error(title: string, content: string) {
        return {
            type: NotificationActions.PUSH_NOTIFICATION, payload: {
                toast: <NotificationToast>{
                    type: NotificationToastType.error,
                    title: title,
                    content: content
                }
            }
        };
    }
}
