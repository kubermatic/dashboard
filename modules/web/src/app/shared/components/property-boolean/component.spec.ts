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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {SharedModule} from '@shared/module';
import {PropertyBooleanComponent} from './component';

describe('PropertyBooleanComponent', () => {
  let fixture: ComponentFixture<PropertyBooleanComponent>;
  let component: PropertyBooleanComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, SharedModule],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MAT_DIALOG_DATA, useValue: {}},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PropertyBooleanComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));
});
