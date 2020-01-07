import {Injectable} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';

@Injectable()
export class PreviousRouteService {
  private previousUrl: string;
  private currentUrl: string;

  constructor(private router: Router) {
    this.currentUrl = this.router.url;
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.previousUrl = this.currentUrl;
        this.currentUrl = event.url;
      }
    });
  }

  getPreviousUrl(): string {
    return this.previousUrl;
  }
}
