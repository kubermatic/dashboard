import { combineReducers } from 'redux';
import { composeReducers, defaultFormReducer } from '@angular-redux/form';

import { Auth, AuthReducer, INITIAL_STATE as INITIAL_STATE_AUTH } from './reducers/auth';
import { Breadcrumb, BreadcrumbReducer, INITIAL_STATE as INITIAL_STATE_BREADCRUNB } from './reducers/breadcrumb';
import {
  INITIAL_STATE as INITIAL_STATE_NOTIFICATION,
  Notification,
  NotificationReducer
} from './reducers/notification';
import { INITIAL_STATE as INITIAL_STATE_WIZARD, Wizard, WizardReducer } from './reducers/wizard';

/* Store Interface */
export interface Store {
  auth: Auth;
  breadcrumb: Breadcrumb;
  notification: Notification;
  wizard: Wizard;
}

/* Store Initial State */
export const INITIAL_STATE: Store = {
  auth: INITIAL_STATE_AUTH,
  breadcrumb: INITIAL_STATE_BREADCRUNB,
  notification: INITIAL_STATE_NOTIFICATION,
  wizard: INITIAL_STATE_WIZARD
};

/* Combine State Reducers */
export const StoreReducer = composeReducers(
  defaultFormReducer(),
  combineReducers<Store>({
    auth: AuthReducer,
    breadcrumb: BreadcrumbReducer,
    notification: NotificationReducer,
    wizard: WizardReducer
  })
);
