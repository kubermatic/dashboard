import { dispatch } from '@angular-redux/store';
import { Action } from '../../shared/interfaces/action.interface';
import { ActionBase } from './action.base';

export class AuthActions extends ActionBase {
  static readonly className: string = 'AuthActions';
  static readonly LOGGED_IN = AuthActions.getActType('LOGGED_IN');
  static readonly LOGGED_OUT = AuthActions.getActType('LOGGED_OUT');
  static readonly FETCH_PROFILE = AuthActions.getActType('FETCH_PROFILE');

  @dispatch()
  static login(profile: any[], token: string): Action {
    return {
      type: AuthActions.LOGGED_IN,
      payload: { profile, token },
    };
  }

  @dispatch()
  static logout(): Action {
    return {
      type: AuthActions.LOGGED_OUT,
    };
  }

  @dispatch()
  static fetchProfile(profile: any[]): Action {
    return {
      type: AuthActions.FETCH_PROFILE,
      payload: { profile },
    };
  }
}
