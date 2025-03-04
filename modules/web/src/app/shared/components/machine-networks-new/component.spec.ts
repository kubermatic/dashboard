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
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {AppConfigService} from '@app/config.service';
import {NutanixService} from '@app/core/services/provider/nutanix';
import {VSphereService} from '@app/core/services/provider/vsphere';
import {NODE_DATA_CONFIG, NodeDataMode} from '@app/node-data/config';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {NodeDataService} from '@core/services/node-data/service';
import {ParamsService} from '@core/services/params';
import {ProjectService} from '@core/services/project';
import {AlibabaService} from '@core/services/provider/alibaba';
import {AnexiaService} from '@core/services/provider/anexia';
import {AWSService} from '@core/services/provider/aws';
import {AzureService} from '@core/services/provider/azure';
import {BaremetalService} from '@core/services/provider/baremetal';
import {DigitalOceanService} from '@core/services/provider/digitalocean';
import {EquinixService} from '@core/services/provider/equinix';
import {GCPService} from '@core/services/provider/gcp';
import {HetznerService} from '@core/services/provider/hetzner';
import {KubeVirtService} from '@core/services/provider/kubevirt';
import {OpenStackService} from '@core/services/provider/openstack';
import {VMwareCloudDirectorService} from '@core/services/provider/vmware-cloud-director';
import {PresetsService} from '@core/services/wizard/presets';
import {WizardService} from '@core/services/wizard/wizard';
import {SharedModule} from '@shared/module';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {MachineNetworkComponent} from './component';

describe('MachineNetworksComponent', () => {
  let component: MachineNetworkComponent;
  let fixture: ComponentFixture<MachineNetworkComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, HttpClientModule, NoopAnimationsModule, SharedModule],
      providers: [
        AppConfigService,
        ClusterSpecService,
        NodeDataService,
        ParamsService,
        PresetsService,
        WizardService,
        AlibabaService,
        AnexiaService,
        AWSService,
        AzureService,
        BaremetalService,
        DigitalOceanService,
        EquinixService,
        GCPService,
        HetznerService,
        OpenStackService,
        NutanixService,
        VMwareCloudDirectorService,
        KubeVirtService,
        VSphereService,
        {provide: ProjectService, useValue: ProjectMockService},
        {provide: NODE_DATA_CONFIG, useValue: NodeDataMode.Wizard},
        {provide: DatacenterService, useClass: DatacenterMockService},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineNetworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the machine network component', () => {
    expect(component).toBeTruthy();
  });

  it('expecting form to be valid', () => {
    const machineNetworks = component._networkArray;
    expect(machineNetworks.valid).toBeTruthy();
  });

  it('expecting form to be invalid', () => {
    component.add();
    const machineNetworks = component._networkArray;
    machineNetworks.controls[0].setValue({
      cidr: '192.182.0.0',
      dnsServers: ['8.8.8.8'],
      gateway: '192.180.0.2',
    });
    expect(machineNetworks.controls[0].valid).toBeFalsy();
  });
});
