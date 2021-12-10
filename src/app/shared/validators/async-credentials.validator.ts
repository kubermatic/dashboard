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

import {AbstractControl, AsyncValidatorFn, ValidationErrors} from '@angular/forms';
import {Observable, of} from 'rxjs';
import {catchError, take} from 'rxjs/operators';
import {environment} from '@environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class CredentialsAsyncValidatorService {
  private readonly _newRestRoot = environment.newRestRoot;

  constructor(private readonly _http: HttpClient) {}

  gkeServiceAccountValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
      const value = control.value.toString();
      if (!value) {
        return of(null);
      }

      const url = `${this._newRestRoot}/providers/gke/validatecredentials`;
      const headers = new HttpHeaders({ServiceAccount: value});
      return this._http.get(url, {headers: headers}).pipe(
        take(1),
        catchError(() => of({invalidGKEServiceAccount: true}))
      );
    };
  }
}
