import { BreadcrumbActions } from './breadcrumb.actions';
import { NotificationActions } from './notification.actions';
import { NgModule } from '@angular/core';
import { AuthActions } from 'app/redux/actions/auth.actions';

@NgModule({
    providers: [
        NotificationActions,
        BreadcrumbActions,
        AuthActions
    ]
})

export class ActionsModule { }
