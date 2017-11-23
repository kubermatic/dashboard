import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import * as fromRoot from "../reducers/index";
import { NotificationToast, NotificationToastType } from "../reducers/index";

@Injectable()
export class NotificationActions {
    public static get PUSH_NOTIFICATION(): string { return "PUSH_NOTIFICATION"; }

    constructor(private store: Store<fromRoot.State>) {
    }

    public success(title: string, content: string) {
        this.store.dispatch({
            type: NotificationActions.PUSH_NOTIFICATION, payload: {
                toast: <NotificationToast>{
                    type: NotificationToastType.success,
                    title: title,
                    content: content
                }
            }
        });
    }

    public alert(title: string, content: string) {
        this.store.dispatch({
            type: NotificationActions.PUSH_NOTIFICATION, payload: {
                toast: <NotificationToast>{
                    type: NotificationToastType.alert,
                    title: title,
                    content: content
                }
            }
        });
    }

    public info(title: string, content: string) {
        this.store.dispatch({
            type: NotificationActions.PUSH_NOTIFICATION, payload: {
                toast: <NotificationToast>{
                    type: NotificationToastType.info,
                    title: title,
                    content: content
                }
            }
        });
    }

    public error(title: string, content: string) {
        this.store.dispatch({
            type: NotificationActions.PUSH_NOTIFICATION, payload: {
                toast: <NotificationToast>{
                    type: NotificationToastType.error,
                    title: title,
                    content: content
                }
            }
        });
    }
}
