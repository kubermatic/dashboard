import { NotificationActions } from './../actions/notification.actions';
import { Action } from "../../shared/interfaces/action.interface";
import { Reducer } from 'redux';

export enum NotificationToastType {
  success,
  alert,
  error,
  info
}

export interface NotificationToast {
  type: NotificationToastType;
  title: string;
  content: string;
  icon?: string;
}


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

