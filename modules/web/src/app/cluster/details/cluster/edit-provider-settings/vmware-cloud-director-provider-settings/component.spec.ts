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

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { BrowserModule } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NutanixProviderSettingsComponent } from '@app/cluster/details/cluster/edit-provider-settings/nutanix-provider-settings/component';
import { ClusterService } from '@core/services/cluster';
import { SharedModule } from '@shared/module';
import { ClusterMockService } from '@test/services/cluster-mock';
import { MatDialogRefMock } from '@test/services/mat-dialog-ref-mock';
import { AlibabaProviderSettingsComponent } from '../alibaba-provider-settings/component';
import { AWSProviderSettingsComponent } from '../aws-provider-settings/component';
import { AzureProviderSettingsComponent } from '../azure-provider-settings/component';
import { EditProviderSettingsComponent } from '../component';
import { DigitaloceanProviderSettingsComponent } from '../digitalocean-provider-settings/component';
import { EquinixProviderSettingsComponent } from '../equinix-provider-settings/component';
import { GCPProviderSettingsComponent } from '../gcp-provider-settings/component';
import { HetznerProviderSettingsComponent } from '../hetzner-provider-settings/component';
import { KubevirtProviderSettingsComponent } from '../kubevirt-provider-settings/component';
import { OpenstackProviderSettingsComponent } from '../openstack-provider-settings/component';
import { VSphereProviderSettingsComponent } from '../vsphere-provider-settings/component';
import { VMwareCloudDirectorProviderSettingsComponent } from './component';

describe('VMwareCloudDirectorProviderSettingsComponent', () => {
  let fixture: ComponentFixture<VMwareCloudDirectorProviderSettingsComponent>;
  let component: VMwareCloudDirectorProviderSettingsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      declarations: [
        EditProviderSettingsComponent,
        GCPProviderSettingsComponent,
        AWSProviderSettingsComponent,
        DigitaloceanProviderSettingsComponent,
        HetznerProviderSettingsComponent,
        OpenstackProviderSettingsComponent,
        VSphereProviderSettingsComponent,
        AzureProviderSettingsComponent,
        EquinixProviderSettingsComponent,
        KubevirtProviderSettingsComponent,
        AlibabaProviderSettingsComponent,
        NutanixProviderSettingsComponent,
        VMwareCloudDirectorProviderSettingsComponent,
      ],
      providers: [
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VMwareCloudDirectorProviderSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should not have valid form after component is created', () => {
    expect(component.form.valid).toBeFalsy();
  });
});
