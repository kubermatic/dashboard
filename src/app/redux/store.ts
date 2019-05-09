import {composeReducers, defaultFormReducer} from '@angular-redux/form';
import {combineReducers} from 'redux';
import {Auth, AuthReducer, INITIAL_STATE as INITIAL_STATE_AUTH} from './reducers/auth';
import {INITIAL_STATE as INITIAL_STATE_NOTIFICATION, Notification, NotificationReducer} from './reducers/notification';

/* Store Interface */
export interface Store {
  auth: Auth;
  notification: Notification;
}

/* Store Initial State */
export const INITIAL_STATE: Store = {
  auth: INITIAL_STATE_AUTH,
  notification: INITIAL_STATE_NOTIFICATION,
};

/* Combine State Reducers */
export const StoreReducer = composeReducers(
    defaultFormReducer(),
    combineReducers<Store>({
      auth: AuthReducer,
      notification: NotificationReducer,
    }),
);
