// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Injectable} from '@angular/core';
import {ActivatedRoute, NavigationEnd, ParamMap, Router} from '@angular/router';
import {Subject} from 'rxjs';
import {filter, switchMap} from 'rxjs/operators';

export enum PathParam {
  ProjectID = 'projectID',
  ClusterID = 'clusterName',
  MachineDeploymentID = 'machineDeploymentID',
}

@Injectable()
export class ParamsService {
  onParamChange = new Subject<void>();

  private _paramMap: ParamMap;
  private _currentUrl = '';

  constructor(
    private _router: Router,
    private _route: ActivatedRoute
  ) {
    this._router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .pipe(
        switchMap((event: NavigationEnd) => {
          this._currentUrl = event.url;

          let active = this._route;
          while (active.firstChild) {
            active = active.firstChild;
          }

          return active.paramMap;
        })
      )
      .subscribe((paramMap: ParamMap) => {
        this._paramMap = paramMap;
        this.onParamChange.next();
      });
  }

  get(name: string): string | undefined {
    return this._paramMap ? this._paramMap.get(name) : undefined;
  }

  getCurrentUrl(): string {
    return this._currentUrl;
  }
}
