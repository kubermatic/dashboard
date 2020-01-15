import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable, Injector} from '@angular/core';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {NotificationService} from '../../services';

@Injectable()
export class ErrorNotificationsInterceptor implements HttpInterceptor {
  private readonly _notificationService: NotificationService;
  // Array of partial error messages that should be silenced in the UI.
  private readonly _silenceErrArr = [
    'custom/style.css',
  ];

  constructor(private readonly _inj: Injector) {
    this._notificationService = this._inj.get(NotificationService);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(tap(() => {}, (errorInstance) => {
      if (!errorInstance) {
        return;
      }

      if (!!errorInstance.error && !!errorInstance.error.error) {
        this._notificationService.error(`Error ${errorInstance.status}: ${
            errorInstance.error.error.message || errorInstance.message || errorInstance.statusText}`);
      } else if (
          errorInstance.message && this._silenceErrArr.every(partial => !errorInstance.message.includes(partial))) {
        this._notificationService.error(`${errorInstance.message}`);
      }
    }));
  }
}
