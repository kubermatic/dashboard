import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {NotificationActions} from '../../../redux/actions/notification.actions';

@Injectable()
export class ErrorNotificationsInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(tap(() => {}, (errorInstance) => {
      if (!errorInstance) {
        return;
      }

      if (!!errorInstance.error && !!errorInstance.error.error) {
        // Silence the 403 error for GET cluster until API gets fixed
        if (errorInstance.error.error.code === 403 && this.isGetClusterEndpoint(errorInstance.url)) {
          return;
        }

        NotificationActions.error(`Error ${errorInstance.status}: ${
            errorInstance.error.error.message || errorInstance.message || errorInstance.statusText}`);
      } else {
        NotificationActions.error(`${errorInstance.status}: ${errorInstance.statusText}`);
      }
    }));
  }

  // TODO(#1677): remove this after fixing API
  isGetClusterEndpoint(url: string): boolean {
    // Simple regex to check if it was an endpoint to GET cluster
    const regex = new RegExp('^http[s]?:\\/\\/.*\\/api\\/v1\\/projects\\/.*\\/dc\\/.*\\/clusters\\/[a-zA-Z0-9]+$');
    return regex.test(url);
  }
}
