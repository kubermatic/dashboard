import {dispatch} from '@angular-redux/store';
import {Action} from '../../shared/interfaces/action.interface';
import {ActionBase} from './action.base';

export class BreadcrumbActions extends ActionBase {
  static readonly className: string = 'BreadcrumbActions';
  static readonly PUT_BREADCRUMB = BreadcrumbActions.getActType('PUT_BREADCRUMB');

  @dispatch()
  static putBreadcrumb(crumb: string): Action {
    return {type: BreadcrumbActions.PUT_BREADCRUMB, payload: {crumb}};
  }
}
