import {Reducer} from 'redux';
import {Action} from '../../shared/interfaces/action.interface';
import {AuthActions} from '../actions/auth.actions';

export enum AuthStatus {
  LoggedIn = 0,
  LoggedOut = 1,
}

export interface Auth {
  profile: any;
  token: string;
  state: AuthStatus;
}

export const INITIAL_STATE: Auth = {
  profile: [],
  token: '',
  state: AuthStatus.LoggedOut,
};

export const AuthReducer: Reducer<Auth> = (state: Auth = INITIAL_STATE, action: Action): Auth => {
  switch (action.type) {
    case AuthActions.LOGGED_IN:
      return Object.assign({}, state, {
        profile: action.payload.profile,
        token: action.payload.token,
        state: AuthStatus.LoggedIn,
      });
    case AuthActions.LOGGED_OUT:
      return Object.assign({}, state, {
        profile: null,
        token: null,
        state: AuthStatus.LoggedOut,
      });
    case AuthActions.FETCH_PROFILE:
      return Object.assign({}, state, {
        profile: action.payload.profile,
        token: state.token,
        state: state.state,
      });
    default:
      return state;
  }
};
