import { Injectable } from '@angular/core';
import { HttpClient, HttpHandler, HttpRequest,  HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http'
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { NotificationComponent } from '../../notification/notification.component';
import { Store } from "@ngrx/store";
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Auth } from '../../auth/auth.service';
import * as fromRoot from "../../reducers/index";

@Injectable()
export class CustomHttpService extends HttpClient{

  constructor(
    handler: HttpHandler, 
    private store: Store<fromRoot.State>, 
    private router: Router, 
    private authService: Auth
  ) {
    super(handler);
  }

   request(first: string | HttpRequest<any>, url?: string, options?: {
    body?: any,
    headers?: HttpHeaders,
    observe?: 'body'|'events'|'response',
    params?: HttpParams,
    reportProgress?: boolean,
    responseType?: 'arraybuffer'|'blob'|'json'|'text',
    withCredentials?: boolean,
  }): Observable<any> {

    let handleError = this.handleError.bind(this);
    let args = typeof first === 'string' ? [first, url, options] : [first];

    return super.request.apply(this, args).catch(handleError);
  }

  handleError(error: HttpErrorResponse): ErrorObservable {

    NotificationComponent.error(this.store, 
      "Error", `${error.status} ${error.statusText}`);

    switch(error.status) {
      case 401: {
        this.authService.logout();
        this.router.navigate(['']);
        break;
      }
      case 404: {
        this.router.navigate(['404']);
        break;
      }
    }

    return Observable.throw(error);
  }
}
