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
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';

import {ApiService, DatacenterService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {SharedModule} from '../../shared/shared.module';
import {fakeOpenstackFlavors, fakeOpenstackAvailabilityZones} from '../../testing/fake-data/addNodeModal.fake';
import {fakeOpenstackCluster} from '../../testing/fake-data/cluster.fake';
import {fakeOpenstackDatacenter} from '../../testing/fake-data/datacenter.fake';
import {nodeDataFake} from '../../testing/fake-data/node.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {DatacenterMockService} from '../../testing/services/datacenter-mock.service';

import {OpenstackNodeDataComponent} from './openstack-node-data.component';

describe('OpenstackNodeDataComponent', () => {
  let fixture: ComponentFixture<OpenstackNodeDataComponent>;
  let component: OpenstackNodeDataComponent;

  beforeEach(async(() => {
    const apiMock = {
      getOpenStackFlavorsForWizard: jest.fn(),
      getOpenStackFlavors: jest.fn(),
      getOpenStackAvailabilityZonesForWizard: jest.fn(),
      getOpenStackAvailabilityZones: jest.fn(),
    };
    apiMock.getOpenStackFlavorsForWizard.mockReturnValue(asyncData(fakeOpenstackFlavors()));
    apiMock.getOpenStackFlavors.mockReturnValue(asyncData(fakeOpenstackFlavors()));
    apiMock.getOpenStackAvailabilityZonesForWizard.mockReturnValue(asyncData(fakeOpenstackAvailabilityZones()));
    apiMock.getOpenStackAvailabilityZones.mockReturnValue(asyncData(fakeOpenstackAvailabilityZones()));

    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, SharedModule, ReactiveFormsModule, HttpClientModule],
      declarations: [OpenstackNodeDataComponent],
      providers: [
        NodeDataService,
        WizardService,
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: ApiService, useValue: apiMock},
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenstackNodeDataComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeOpenstackCluster().spec.cloud;
    component.nodeData = nodeDataFake();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });

  it('should disable floating ip checkbox when required by datacenter', () => {
    const datacenterService = TestBed.inject(DatacenterService);
    const dc = fakeOpenstackDatacenter();
    dc.spec.openstack.enforce_floating_ip = true;
    jest.spyOn(datacenterService, 'getDatacenter').mockReturnValue(of(dc));
    jest.spyOn(component, 'isInWizard').mockReturnValue(false);

    fixture.detectChanges();
    const tooltipEl = fixture.debugElement.query(By.css('.km-floating-ip-checkbox .km-icon-info'));
    expect(tooltipEl).not.toBeNull();
    expect(component.form.controls.useFloatingIP.disabled).toBeTruthy();
  });

  it('should enable floating ip checkbox when not enforced by datacenter', () => {
    const tooltipEl = fixture.debugElement.query(By.css('.km-floating-ip-checkbox .km-icon-info'));
    jest.spyOn(component, 'isInWizard').mockReturnValue(false);

    fixture.detectChanges();
    expect(tooltipEl).toBeNull();
    expect(component.form.controls.useFloatingIP.disabled).toBeFalsy();
  });
});
