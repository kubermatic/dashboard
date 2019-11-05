import {Injectable, Injector} from '@angular/core';
import {NavigationEnd, Router} from '@angular/router';
import {filter, pairwise} from 'rxjs/operators';

@Injectable()
export class HistoryService {
  private _router: Router;
  private _previousStateUrl: string;
  private _currentStateUrl: string;

  constructor(private readonly _injector: Injector) {}

  init(): void {
    if (!this._router) {
      this._router = this._injector.get(Router);

      this._router.events.pipe(filter(e => e instanceof NavigationEnd))
          .pipe(pairwise())
          .subscribe((e: [NavigationEnd, NavigationEnd]) => {
            this._previousStateUrl = e[0].url;
            this._currentStateUrl = e[1].url;
          });
    }
  }

  goBack(defaultState: string): Promise<boolean> {
    if (this._previousStateUrl && this._previousStateUrl !== this._currentStateUrl) {
      return this._router.navigateByUrl(this._previousStateUrl);
    }

    return this._router.navigate([defaultState], {queryParamsHandling: 'preserve'});
  }
}
