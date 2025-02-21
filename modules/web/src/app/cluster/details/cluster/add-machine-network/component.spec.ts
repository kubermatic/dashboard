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
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MachineNetworksComponent} from '@app/machine-networks/component';
import {ClusterService} from '@core/services/cluster';
import {NotificationService} from '@core/services/notification';
import {WizardService} from '@core/services/wizard/wizard';
import {SharedModule} from '@shared/module';
import {fakeClusterWithMachineNetwork} from '@test/data/cluster-with-machine-networks';
import {fakeProject} from '@test/data/project';
import {ClusterMockService} from '@test/services/cluster-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {AddMachineNetworkComponent} from './component';

describe('AddMachineNetworkComponent', () => {
  let component: AddMachineNetworkComponent;
  let fixture: ComponentFixture<AddMachineNetworkComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, BrowserAnimationsModule, SharedModule],
      declarations: [AddMachineNetworkComponent, MachineNetworksComponent],
      providers: [
        WizardService,
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        NotificationService,
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMachineNetworkComponent);
    component = fixture.componentInstance;
    component.cluster = fakeClusterWithMachineNetwork();
    component.projectID = fakeProject().id;

    fixture.detectChanges();
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });
});
