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
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';

import {ProjectService} from '../../../core/services';
import {SharedModule} from '../../../shared/shared.module';
import {fakeServiceAccountToken} from '../../../testing/fake-data/serviceaccount.fake';
import {RouterStub, RouterTestingModule} from '../../../testing/router-stubs';
import {ProjectMockService} from '../../../testing/services/project-mock.service';

import {TokenDialogComponent} from './token-dialog.component';

const modules: any[] = [BrowserModule, HttpClientModule, BrowserAnimationsModule, RouterTestingModule, SharedModule];

describe('TokenDialogComponent', () => {
  let component: TokenDialogComponent;
  let fixture: ComponentFixture<TokenDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {serviceaccountToken: fakeServiceAccountToken()},
        },
        {provide: MatDialogRef, useValue: {}},
        {provide: Router, useClass: RouterStub},
        {provide: ProjectService, useClass: ProjectMockService},
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TokenDialogComponent);
    component = fixture.componentInstance;
    component.serviceaccountToken = fakeServiceAccountToken();

    fixture.detectChanges();
  });

  it('should create the token dialog component', () => {
    expect(component).toBeTruthy();
  });
});
