import {Injectable} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs/operators';

@Injectable()
export class PreviousRouteService {
  private history = [];

  constructor(private router: Router) {}

  loadRouting(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((urlAfterRedirects: NavigationEnd) => {
        this.history = [...this.history, urlAfterRedirects];
        if (this.history.length > 10) {
          this.history.splice(0, 1);
        }
      });
  }

  getHistory(): string[] {
    return this.history;
  }

  getPreviousUrl(): string {
    return this.history[this.history.length - 2] || '/';
  }
}
