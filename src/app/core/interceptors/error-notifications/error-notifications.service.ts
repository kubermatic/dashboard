import { NotificationActions } from '../../../redux/actions/notification.actions';
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class ErrorNotificationsInterceptor implements HttpInterceptor {
  constructor() { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next
      .handle(req)
      .pipe(
        tap(
          event => {},
          errorInstance => {
            if (errorInstance) {
              if (!!errorInstance.error.error) {
                NotificationActions.error(
                  `Error ${errorInstance.status}`,
                  `${errorInstance.error.error.message || errorInstance.message || errorInstance.statusText}`
                );
              } else {
                NotificationActions.error(
                  `An Error occurred`,
                  `${errorInstance.status}: ${errorInstance.statusText}`
                );
              }
            }
          }
        )
      );
  }
}
