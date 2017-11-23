import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import {Actions} from "../reducers/actions";
import { NotificationToast, NotificationToastType } from "../reducers/index";

@Injectable()
export class NotificationActions {
    constructor(private store: Store<fromRoot.State>) {
    }

    public success(title: string, content: string) {
        return this.store.dispatch({
            type: Actions.PUSH_NOTIFICATION, payload: {
                toast: <NotificationToast>{
                    type: NotificationToastType.success,
                    title: title,
                    content: content
                }
            }
        });
    }

    public alert(title: string, content: string) {
        return this.store.dispatch({
            type: Actions.PUSH_NOTIFICATION, payload: {
                toast: <NotificationToast>{
                    type: NotificationToastType.alert,
                    title: title,
                    content: content
                }
            }
        });
    }

    public info(title: string, content: string) {
        return this.store.dispatch({
            type: Actions.PUSH_NOTIFICATION, payload: {
                toast: <NotificationToast>{
                    type: NotificationToastType.info,
                    title: title,
                    content: content
                }
            }
        });
    }

    public error(title: string, content: string) {
        return this.store.dispatch({
            type: Actions.PUSH_NOTIFICATION, payload: {
                toast: <NotificationToast>{
                    type: NotificationToastType.error,
                    title: title,
                    content: content
                }
            }
        });
    }
}
