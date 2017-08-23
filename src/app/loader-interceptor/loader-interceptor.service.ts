import { Injectable} from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import 'rxjs/add/operator/do';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor{
  private progressBarElement: HTMLElement;
  private isShown: boolean;
  
  constructor() {
    this.progressBarElement = document.getElementById('km-top-progress-bar');
    this.isShown = true;
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {    
    this.toggleVisibility();
    
    return next
      .handle(req)
      .do((event) => {
        if (event instanceof HttpResponse) {
          this.toggleVisibility();    
        }
      });
  }

  private toggleVisibility(): void {
    this.progressBarElement.style.visibility = this.isShown ? 'visible' : 'hidden';
    this.isShown = ! this.isShown;
  }
}
