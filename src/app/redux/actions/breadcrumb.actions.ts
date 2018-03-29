import { ActionBase } from './action.base';
import { Action } from '../../shared/interfaces/action.interface';

import { dispatch } from '@angular-redux/store';

export class BreadcrumbActions extends ActionBase {
  static readonly className: string = 'BreadcrumbActions';
  static readonly PUT_BREADCRUMB = BreadcrumbActions.getActType('PUT_BREADCRUMB');

  @dispatch()
  static putBreadcrumb(crumb: string): Action {
    return { type: BreadcrumbActions.PUT_BREADCRUMB, payload: { crumb } };
  }
}
