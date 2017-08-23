import { Injectable} from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/do';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor{
  private progressBarElement: HTMLElement;
  
  constructor() {
    this.progressBarElement = document.getElementById('km-top-progress-bar');
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {    
    this.progressBarElement.style.visibility = 'visible';

    return next
      .handle(req)
      .do((event) => {
        if (event instanceof HttpResponse) {
          this.progressBarElement.style.visibility ='hidden';
        }
      });
  }
}
