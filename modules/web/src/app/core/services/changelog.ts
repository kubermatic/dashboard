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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ChangelogDialog} from '@core/components/changelog/dialog';
import {environment} from '@environments/environment';
import {Changelog} from '@shared/model/changelog';
import {of} from 'rxjs';
import {catchError, take} from 'rxjs/operators';
import _ from 'lodash';

@Injectable({providedIn: 'root'})
export class ChangelogService {
  private _changelog: Changelog;

  get changelog(): Changelog {
    return _.isEmpty(this._changelog) ? undefined : this._changelog;
  }

  constructor(
    private readonly _http: HttpClient,
    private readonly _matDialog: MatDialog
  ) {}

  init(): void {
    this._http
      .get<Changelog>(environment.changelogUrl)
      .pipe(take(1))
      .pipe(catchError(_ => of({} as Changelog)))
      .subscribe(changelog => (this._changelog = changelog));
  }

  open(): void {
    this._matDialog.open(ChangelogDialog, {
      panelClass: 'km-changelog-dialog',
      disableClose: true,
    });
  }
}
