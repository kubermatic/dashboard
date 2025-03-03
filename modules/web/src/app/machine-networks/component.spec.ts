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
import { FormArray } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { VSphereService } from '@app/core/services/provider/vsphere';
import { WizardService } from '@core/services/wizard/wizard';
import { SharedModule } from '@shared/module';
import { fakeClusterWithMachineNetwork } from '@test/data/cluster-with-machine-networks';
import { MachineNetworksComponent } from './component';

describe('MachineNetworksComponent', () => {
  let component: MachineNetworksComponent;
  let fixture: ComponentFixture<MachineNetworksComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, SharedModule],
      declarations: [MachineNetworksComponent],
      providers: [WizardService, VSphereService],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineNetworksComponent);
    component = fixture.componentInstance;
    component.cluster = fakeClusterWithMachineNetwork();

    fixture.detectChanges();
  });

  it('should create the machine network component', () => {
    expect(component).toBeTruthy();
  });

  it('expecting form to be valid', () => {
    const machineNetworks = component.form.get('machineNetworks') as FormArray;
    machineNetworks.controls[0].setValue({
      cidr: '192.182.0.0/29',
      dnsServers: ['8.8.8.8'],
      gateway: '192.180.0.2',
    });
    expect(machineNetworks.controls[0].valid).toBeTruthy();
  });

  it('expecting form to be invalid', () => {
    const machineNetworks = component.form.get('machineNetworks') as FormArray;
    machineNetworks.controls[0].setValue({
      cidr: '192.182.0.0',
      dnsServers: ['8.8.8.8'],
      gateway: '192.180.0.2',
    });
    expect(machineNetworks.controls[0].valid).toBeFalsy();
  });
});
