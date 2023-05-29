// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {ClusterService} from '@core/services/cluster';
import {NotificationService} from '@core/services/notification';
import {UserService} from '@core/services/user';
import {UserMockService} from '@test/services/user-mock';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeProject} from '@test/data/project';
import {ClusterMockService} from '@test/services/cluster-mock';
import {ActivatedRouteStub} from '@test/services/router-stubs';
import {TerminalComponent} from './component';

describe('TerminalComponent', () => {
  let component: TerminalComponent;
  let fixture: ComponentFixture<TerminalComponent>;
  let activatedRoute: ActivatedRouteStub;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserModule, RouterTestingModule, BrowserAnimationsModule, MatSnackBarModule],
      declarations: [TerminalComponent],
      providers: [
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: UserService, useClass: UserMockService},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TerminalComponent);
    component = fixture.componentInstance;

    // Fake Data for Cluster
    component.cluster = fakeDigitaloceanCluster();

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = {
      projectId: fakeProject().id,
      clusterId: component.cluster.id,
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
