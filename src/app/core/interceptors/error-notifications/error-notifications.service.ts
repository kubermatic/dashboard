import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationActions } from '../../../redux/actions/notification.actions';

@Injectable()
export class ErrorNotificationsInterceptor implements HttpInterceptor {
  constructor() { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next
      .handle(req)
      .pipe(
        tap(
          () => {},
          (errorInstance) => {
            if (errorInstance) {
              if (!!errorInstance.error && !!errorInstance.error.error) {
                NotificationActions.error(
                  `Error ${errorInstance.status}`,
                  `${errorInstance.error.error.message || errorInstance.message || errorInstance.statusText}`,
                );
              } else {
                NotificationActions.error(
                  `An Error occurred`,
                  `${errorInstance.status}: ${errorInstance.statusText}`,
                );
              }
            }
          },
        ),
      );
  }
}
