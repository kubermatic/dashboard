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

import {AbstractControl, AsyncValidator, AsyncValidatorFn, ValidationErrors} from '@angular/forms';
import {GlobalModule} from '@core/services/global/module';
import {Observable, of} from 'rxjs';
import {catchError, take} from 'rxjs/operators';
import {Cluster} from '@shared/entity/cluster';
import {environment} from '@environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';

export class GKEServiceAccountValidator implements AsyncValidator {
  private readonly _newRestRoot = environment.newRestRoot;
  private _http: HttpClient;

  constructor() {
    this._http = GlobalModule.injector.get(HttpClient);
  }

  validate(control: AbstractControl): Observable<ValidationErrors | null> {
    const value = control.value.toString();
    if (!value) {
      return of(null);
    }

    const url = `${this._newRestRoot}/providers/gke/validatecredetials`;
    const headers = new HttpHeaders({ServiceAccount: value});
    return this._http
      .get<Cluster>(url, {headers: headers})
      .pipe(catchError(() => of({invalidGKEServiceAccount: true})))
      .pipe(take(1));
  }
}

export class AsyncValidators {
  static InvalidGKEServiceAccount(): AsyncValidatorFn {
    const validator = new GKEServiceAccountValidator();
    return validator.validate.bind(validator);
  }
}
