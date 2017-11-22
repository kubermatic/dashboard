import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificationComponent } from "../../../notification/notification.component";
import { Store } from "@ngrx/store";
import * as fromRoot from "../../../reducers/index";

@Injectable()
export class ErrorNotificationsInterceptor implements HttpInterceptor{
  constructor(private store:Store<fromRoot.State>) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next
      .handle(req)
        .do(
          event => {},
          errorInstance => {
            NotificationComponent.error(
              this.store,
              `Error ${errorInstance.status}`,
              `${errorInstance.error.error.message || errorInstance.statusText}` 
            );
          }
        );
  }
}