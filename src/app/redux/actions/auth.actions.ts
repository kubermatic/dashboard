import { Injectable } from "@angular/core";
import { Store } from "@ngrx/store";
import * as fromRoot from "../reducers/index";

@Injectable()
export class AuthActions {
    public static get LOGGED_IN(): string { return "LOGGED_IN"; }
    public static get LOGGED_OUT(): string { return "LOGGED_OUT"; }
    public static get FETCH_PROFILE(): string { return "FETCH_PROFILE"; }

    constructor(private store: Store<fromRoot.State>) {
    }

    public login(profile: any[], token: string) {
        this.store.dispatch({ 
            type: AuthActions.LOGGED_IN, 
            payload: { profile, token } 
        });
    }

    public logout() {
        this.store.dispatch({ 
            type: AuthActions.LOGGED_OUT
        });
    }

    public fetchProfile(profile: any[]) {
        this.store.dispatch({ 
            type: AuthActions.FETCH_PROFILE,
            payload: { profile } 
        });
    }
}
