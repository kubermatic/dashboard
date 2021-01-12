// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {fakeSSHKeys} from '@app/testing/fake-data/sshkey.fake';
import {RouterStub} from '@app/testing/router-stubs';
import {ActivatedRouteMock} from '@app/testing/services/activate-route-mock';
import {asyncData} from '@app/testing/services/api-mock.service';
import {AppConfigMockService} from '@app/testing/services/app-config-mock.service';
import {ProjectMockService} from '@app/testing/services/project-mock.service';
import {UserMockService} from '@app/testing/services/user-mock.service';
import {ApiService} from '@core/services/api/service';
import {ProjectService} from '@core/services/project/service';
import {UserService} from '@core/services/user/service';
import {ClusterService} from '@shared/services/cluster.service';
import {SharedModule} from '@shared/shared.module';
import {ClusterSSHKeysComponent} from './component';

describe('ClusterSSHKeys', () => {
  let fixture: ComponentFixture<ClusterSSHKeysComponent>;
  let component: ClusterSSHKeysComponent;

  beforeEach(
    waitForAsync(() => {
      const apiMock = {getSSHKeys: jest.fn()};
      apiMock.getSSHKeys.mockReturnValue(asyncData(fakeSSHKeys()));

      TestBed.configureTestingModule({
        imports: [BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
        declarations: [ClusterSSHKeysComponent],
        providers: [
          ClusterService,
          {provide: ActivatedRoute, useClass: ActivatedRouteMock},
          {provide: ApiService, useValue: apiMock},
          {provide: ProjectService, useClass: ProjectMockService},
          {provide: UserService, useClass: UserMockService},
          {provide: AppConfigService, useClass: AppConfigMockService},
          {provide: Router, useClass: RouterStub},
        ],
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterSSHKeysComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the ssh-key-form-field cmp', () => {
    expect(component).toBeTruthy();
  });

  it('no ssh keys are required', () => {
    expect(component.form.controls.keys.hasError('required')).toBeFalsy();
  });
});
