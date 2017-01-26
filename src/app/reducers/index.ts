import { createSelector } from "reselect";
import { storeFreeze } from "ngrx-store-freeze";
import { storeLogger } from "ngrx-store-logger";

import { compose, ComposeSignature } from "@ngrx/core/compose";
import { combineReducers } from "@ngrx/store";

import { environment } from "../../environments/environment";

import * as fromAuth from "./auth";
import * as fromBreadcrumbs from "./breadcrumb";

export interface State {
  auth: fromAuth.Auth;
  breadcrumb: fromBreadcrumbs.Breadcrumb;
}

// All reducers
const reducers = {
  auth: fromAuth.authReducer,
  breadcrumb: fromBreadcrumbs.breadcrumbReducer
};

const developmentReducer = compose(storeFreeze, storeLogger(), combineReducers)(reducers);
const productionReducer = combineReducers(reducers);

export function combinedReducer(state: any, action: any): ComposeSignature {
  if ( environment.production) {
    return productionReducer(state, action);
  } else {
    return developmentReducer(state, action);
  }
}

export const getAuthState = (state: State) => state.auth;
export const getAuthProfile = createSelector(getAuthState, fromAuth.getProfile);
export const getAuthLoggedIn = createSelector(getAuthState, fromAuth.getAuthState);

export const getBreadcrumbState = (state: State) => state.breadcrumb;
export const getBreadcrumb = createSelector(getBreadcrumbState, fromBreadcrumbs.getCrumb);

export * from "./auth";
export * from "./breadcrumb";
export * from "./actions";
