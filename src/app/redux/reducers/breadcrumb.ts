import { Action } from '../../shared/interfaces/action.interface';
import { Reducer } from 'redux';
import { BreadcrumbActions } from '../actions/breadcrumb.actions';

export interface Breadcrumb {
  crumb: string;
}

export const INITIAL_STATE: Breadcrumb = {
  crumb: '',
};

export const BreadcrumbReducer: Reducer<Breadcrumb> = (state: Breadcrumb = INITIAL_STATE, action: Action): Breadcrumb => {
  switch (action.type) {
    case BreadcrumbActions.PUT_BREADCRUMB:
      return Object.assign({}, state, {
        crumb: action.payload.crumb,
      });
    default:
      return state;
  }
};


