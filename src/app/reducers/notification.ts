import {Action} from "@ngrx/store";
import {Actions} from "./actions";

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

const initialState: Notification = {
  toast: null,
};

export function notificationReducer(state: Notification = initialState, action: Action): Notification {
  switch (action.type) {
    case Actions.PUSH_NOTIFICATION:
      return Object.assign({}, state, {
        toast: action.payload.toast,
      });
    default:
      return state;
  }
}

export const getToast = (state: Notification) => state.toast;
