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
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AppConfigService} from '@app/config.service';
import {NODE_DATA_CONFIG, NodeDataMode} from '@app/node-data/config';
import {BaremetalService} from '@core/services/provider/baremetal';
import {AuthMockService} from '@test/services/auth-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {Auth} from '@core/services/auth/service';
import {ClusterSpecService} from '@core/services/cluster-spec';
import {DatacenterService} from '@core/services/datacenter';
import {NodeDataService} from '@core/services/node-data/service';
import {ProjectService} from '@core/services/project';
import {PresetsService} from '@core/services/wizard/presets';
import {WizardService} from '@core/services/wizard/wizard';
import {SharedModule} from '@shared/module';
import {MachineNetworkStepComponent} from './component';
import {AlibabaService} from '@core/services/provider/alibaba';
import {MachineDeploymentService} from '@core/services/machine-deployment';
import {AnexiaService} from '@core/services/provider/anexia';
import {AWSService} from '@core/services/provider/aws';
import {AzureService} from '@core/services/provider/azure';
import {GCPService} from '@core/services/provider/gcp';
import {HetznerService} from '@core/services/provider/hetzner';
import {DigitalOceanService} from '@core/services/provider/digitalocean';
import {OpenStackService} from '@core/services/provider/openstack';
import {EquinixService} from '@core/services/provider/equinix';
import {NutanixService} from '@app/core/services/provider/nutanix';
import {VMwareCloudDirectorService} from '@core/services/provider/vmware-cloud-director';
import {KubeVirtService} from '@core/services/provider/kubevirt';
import {ApplicationService} from '@core/services/application';
import {VSphereService} from '@app/core/services/provider/vsphere';

describe('MachineNetworkStepComponent', () => {
  let fixture: ComponentFixture<MachineNetworkStepComponent>;
  let component: MachineNetworkStepComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
      declarations: [MachineNetworkStepComponent],
      providers: [
        WizardService,
        NodeDataService,
        ClusterSpecService,
        PresetsService,
        DatacenterService,
        AppConfigService,
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
        MachineDeploymentService,
        ApplicationService,
        VSphereService,
        {provide: ProjectService, useValue: ProjectMockService},
        {provide: Auth, useClass: AuthMockService},
        {provide: NODE_DATA_CONFIG, useValue: NodeDataMode.Wizard},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineNetworkStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the Machine Network Step cmp', () => {
    expect(component).toBeTruthy();
  });
});
