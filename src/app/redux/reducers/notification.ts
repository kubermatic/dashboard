import { Reducer } from 'redux';
import { Action } from '../../shared/interfaces/action.interface';
import { NotificationToast } from './../../shared/interfaces/notification-toast.interface';
import { NotificationActions } from './../actions/notification.actions';

export interface Notification {
  toast: NotificationToast;
}

export const INITIAL_STATE: Notification = {
  toast: null,
};

export const NotificationReducer: Reducer<Notification> = (state: Notification = INITIAL_STATE, action: Action): Notification => {
  switch (action.type) {
    case NotificationActions.PUSH_NOTIFICATION:
      return Object.assign({}, state, {
        toast: action.payload.toast,
      });
    default:
      return state;
  }
};
