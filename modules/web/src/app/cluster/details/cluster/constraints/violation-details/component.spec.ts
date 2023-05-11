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
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {UserService} from '@core/services/user';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeConstraints, fakeViolations} from '@test/data/opa';
import {fakeProject} from '@test/data/project';
import {OPAService} from '@core/services/opa';
import {SharedModule} from '@shared/module';
import {UserMockService} from '@test/services/user-mock';
import {ViolationDetailsComponent} from './component';

describe('ViolationDetailsComponent', () => {
  let fixture: ComponentFixture<ViolationDetailsComponent>;
  let component: ViolationDetailsComponent;

  beforeEach(waitForAsync(() => {
    const opaMock = {
      saveViolationPageIndex: jest.fn(),
      getViolationPageIndex: jest.fn(),
      refreshConstraint: () => {},
    };
    opaMock.saveViolationPageIndex.mockReturnValue(null);
    opaMock.getViolationPageIndex.mockReturnValue(0);

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [ViolationDetailsComponent],
      providers: [
        {provide: UserService, useClass: UserMockService},
        {provide: OPAService, useValue: opaMock},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(ViolationDetailsComponent);
    component = fixture.componentInstance;
    component.violations = fakeViolations();
    component.settings = {itemsPerPage: 10};
    component.constraintName = fakeConstraints()[0].name;
    component.projectId = fakeProject().id;
    component.clusterId = fakeDigitaloceanCluster().id;
    fixture.detectChanges();
  }));

  it('should create the violation details component', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));
});
