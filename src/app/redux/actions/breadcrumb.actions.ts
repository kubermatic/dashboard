import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import * as fromRoot from "../reducers/index";

@Injectable()
export class BreadcrumbActions {
    public static get PUT_BREADCRUMB(): string { return "PUT_BREADCRUMB"; }

    constructor(private store: Store<fromRoot.State>) {
    }

    public putBreadcrumb(crumb: string) {
        this.store.dispatch({ type: BreadcrumbActions.PUT_BREADCRUMB, payload: { crumb } });
    }
}
