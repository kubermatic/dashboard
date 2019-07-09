import {Injectable} from '@angular/core';
import {ActivatedRoute, NavigationEnd, ParamMap, Router} from '@angular/router';
import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';

export enum PathParam {
  ProjectID = 'projectID',
}

@Injectable()
export class ParamsService {
  onParamChange = new Subject<void>();

  private _paramMap: ParamMap;

  constructor(private _router: Router, private _route: ActivatedRoute) {
    this._router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      let active = this._route;
      while (active.firstChild) {
        active = active.firstChild;
      }

      active.paramMap.subscribe((paramMap: ParamMap) => {
        this._paramMap = paramMap;
        this.onParamChange.next();
      });
    });
  }

  get(name: string): string|undefined {
    return !!this._paramMap ? this._paramMap.get(name) : undefined;
  }
}
