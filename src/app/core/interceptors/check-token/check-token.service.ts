import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Auth } from '../../services';

@Injectable()
export class CheckTokenInterceptor implements HttpInterceptor {
  constructor(private auth: Auth, private router: Router) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.auth.authenticated()) {
      this.router.navigate(['']);
    }

    return next
      .handle(req);
  }
}
