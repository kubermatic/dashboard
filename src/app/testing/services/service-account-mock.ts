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

import {EventEmitter, Injectable} from '@angular/core';
import {Observable, of, Subject} from 'rxjs';
import {Project} from '@shared/entity/project';
import {
  fakeServiceAccount,
  fakeServiceAccounts,
  fakeServiceAccountToken,
  fakeServiceAccountTokens,
} from '@app/testing/fake-data/serviceaccount';
import {
  ServiceAccount,
  ServiceAccountModel,
  ServiceAccountToken,
  ServiceAccountTokenPatch,
} from '@shared/entity/service-account';

@Injectable()
export class ServiceAccountMockService {
  onProjectChange = new EventEmitter<Project>();
  onProjectsUpdate = new Subject<void>();

  get(_projectID: string): Observable<ServiceAccount[]> {
    return of(fakeServiceAccounts());
  }

  create(_projectID: string, _serviceAccount: ServiceAccountModel): Observable<ServiceAccount> {
    return of(fakeServiceAccount());
  }

  edit(_projectID: string, _serviceAccount: ServiceAccount): Observable<ServiceAccount> {
    return of(fakeServiceAccount());
  }

  delete(_projectID: string, _serviceAccount: ServiceAccount): Observable<any> {
    return of(null);
  }

  getTokens(_projectID: string, _serviceaccount: ServiceAccount): Observable<ServiceAccountToken[]> {
    return of(fakeServiceAccountTokens());
  }

  createToken(_projectID: string, _serviceaccount: ServiceAccount): Observable<ServiceAccountToken> {
    return of(fakeServiceAccountToken());
  }

  editToken(
    _projectID: string,
    _serviceAccount: ServiceAccount,
    _token: ServiceAccountToken
  ): Observable<ServiceAccountToken> {
    return of(fakeServiceAccountToken());
  }

  regenerateToken(
    _projectID: string,
    _serviceaccount: ServiceAccount,
    _token: ServiceAccountToken
  ): Observable<ServiceAccountToken> {
    return of(fakeServiceAccountToken());
  }

  patchToken(
    _projectID: string,
    _serviceaccount: ServiceAccount,
    _token: ServiceAccountToken,
    _patchToken: ServiceAccountTokenPatch
  ): Observable<ServiceAccountToken> {
    return of(fakeServiceAccountToken());
  }

  deleteToken(_projectID: string, _serviceaccount: ServiceAccount, _token: ServiceAccountToken): Observable<any> {
    return of(null);
  }
}
