import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, convertToParamMap} from '@angular/router';

@Injectable()
export class ActivatedRouteMock {
  private _paramMap = convertToParamMap({});

  snapshot = {
    paramMap: this._paramMap,
  } as ActivatedRouteSnapshot;
}
