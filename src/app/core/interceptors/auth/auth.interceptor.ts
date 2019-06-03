import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest,} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {environment} from '../../../../environments/environment';
import {Auth} from '../../services';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly _restRoot: string = environment.restRoot;

  constructor(private _auth: Auth) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this._auth.getBearerToken();
    // Filter requests made to our backend starting with 'restRoot' and append request header
    // with token.
    if (req.url.startsWith(this._restRoot) && token.length) {
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`),
      });

      return next.handle(authReq);
    }

    return next.handle(req);
  }
}
