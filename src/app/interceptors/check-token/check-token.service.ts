import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Auth } from '../../core/services';
import { Router } from '@angular/router';

@Injectable()
export class CheckTokenInterceptor implements HttpInterceptor{
  constructor(private auth: Auth, private router: Router) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if(!this.auth.authenticated()) {
      this.router.navigate(['']);
    }

    return next
      .handle(req);
  }
}
