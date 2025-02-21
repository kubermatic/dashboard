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
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {Auth} from '@core/services/auth/service';
import {DatacenterService} from '@core/services/datacenter';
import {AuthMockService} from '@test/services/auth-mock';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {ActivatedRouteStub, RouterStub} from '@test/services/router-stubs';
import {DashboardComponent} from './component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule],
      declarations: [DashboardComponent],
      providers: [
        {provide: Router, useClass: RouterStub},
        {provide: Auth, useClass: AuthMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create the cmp', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));
});
