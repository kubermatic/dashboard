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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {AppConfigService} from '@app/config.service';
import {ServiceAccountModule} from '@app/serviceaccount/module';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {CoreModule} from '@core/module';
import {ServiceAccountTokenDialog, ServiceAccountTokenDialogData, ServiceAccountTokenDialogMode} from './component';

describe('ServiceAccountTokenDialog', () => {
  let fixture: ComponentFixture<ServiceAccountTokenDialog>;
  let component: ServiceAccountTokenDialog;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CoreModule, ServiceAccountModule],
      providers: [
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            projectID: 'test-project',
            serviceAccount: {},
            mode: ServiceAccountTokenDialogMode.Create,
          } as ServiceAccountTokenDialogData,
        },
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceAccountTokenDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.form.valid).toBeFalsy();
  });

  it('should have required fields', () => {
    expect(component.form.valid).toBeFalsy();
    expect(component.form.controls.name.valid).toBeFalsy();
    expect(component.form.controls.name.hasError('invalidForm')).toBeTruthy();

    component.form.controls.name.setValue({name: 'test-service-account-token'});
    expect(component.form.controls.name.hasError('invalidForm')).toBeFalsy();
  });
});
