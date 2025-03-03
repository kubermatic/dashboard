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

import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BrowserModule } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { ProjectService } from '@core/services/project';
import { SharedModule } from '@shared/module';
import { fakeServiceAccountToken } from '@test/data/serviceaccount';
import { ProjectMockService } from '@test/services/project-mock';
import { RouterStub } from '@test/services/router-stubs';
import { ServiceAccountTokenInformationStepComponent } from './component';

describe('ServiceAccountTokenInformationStepComponent', () => {
  let component: ServiceAccountTokenInformationStepComponent;
  let fixture: ComponentFixture<ServiceAccountTokenInformationStepComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, SharedModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {serviceaccountToken: fakeServiceAccountToken()},
        },
        {provide: MatDialogRef, useValue: {}},
        {provide: Router, useClass: RouterStub},
        {provide: ProjectService, useClass: ProjectMockService},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceAccountTokenInformationStepComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
