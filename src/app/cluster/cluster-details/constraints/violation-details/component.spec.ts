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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {fakeViolations} from '@app/testing/fake-data/opa.fake';
import {CoreModule} from '@core/module';
import {SharedModule} from '@shared/shared.module';
import {ViolationDetailsComponent} from './component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule];

describe('ViolationDetailsComponent', () => {
  let fixture: ComponentFixture<ViolationDetailsComponent>;
  let component: ViolationDetailsComponent;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        imports: [...modules],
        declarations: [ViolationDetailsComponent],
        providers: [],
      }).compileComponents();
    })
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(ViolationDetailsComponent);
      component = fixture.componentInstance;
      component.violations = fakeViolations();
      component.settings = {itemsPerPage: 10};
      fixture.detectChanges();
    })
  );

  it(
    'should create the violation details component',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );
});
