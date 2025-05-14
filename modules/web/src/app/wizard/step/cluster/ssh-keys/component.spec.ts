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

import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {RouterStub} from '@test/services/router-stubs';
import {ActivatedRouteMock} from '@test/services/activate-route-mock';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {UserMockService} from '@test/services/user-mock';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {ProjectService} from '@core/services/project';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {ClusterSSHKeysComponent} from './component';
import {SSHKeyService} from '@app/core/services/ssh-key/ssh-key';
import {asyncData} from '@test/services/cluster-mock';
import {fakeSSHKeys} from '@test/data/sshkey';

describe('ClusterSSHKeys', () => {
  let fixture: ComponentFixture<ClusterSSHKeysComponent>;
  let component: ClusterSSHKeysComponent;

  beforeEach(waitForAsync(() => {
    const sshKeyServiceMock = {list: jest.fn()};
    sshKeyServiceMock.list.mockReturnValue(asyncData(fakeSSHKeys()));

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
      declarations: [ClusterSSHKeysComponent],
      providers: [
        ClusterSpecService,
        {provide: ActivatedRoute, useClass: ActivatedRouteMock},
        {provide: SSHKeyService, useValue: sshKeyServiceMock},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: Router, useClass: RouterStub},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

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
