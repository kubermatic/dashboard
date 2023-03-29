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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatLegacyDialogRef as MatDialogRef} from '@angular/material/legacy-dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {RouterStub} from '@test/services/router-stubs';
import {ClusterMockService} from '@test/services/cluster-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {NotificationMockService} from '@test/services/notification-mock';
import {ClusterService} from '@core/services/cluster';
import {NotificationService} from '@core/services/notification';
import {SharedModule} from '@shared/module';
import {AlibabaProviderSettingsComponent} from './alibaba-provider-settings/component';
import {AWSProviderSettingsComponent} from './aws-provider-settings/component';
import {AzureProviderSettingsComponent} from './azure-provider-settings/component';
import {DigitaloceanProviderSettingsComponent} from './digitalocean-provider-settings/component';
import {EditProviderSettingsComponent} from './component';
import {GCPProviderSettingsComponent} from './gcp-provider-settings/component';
import {HetznerProviderSettingsComponent} from './hetzner-provider-settings/component';
import {KubevirtProviderSettingsComponent} from './kubevirt-provider-settings/component';
import {OpenstackProviderSettingsComponent} from './openstack-provider-settings/component';
import {EquinixProviderSettingsComponent} from './equinix-provider-settings/component';
import {VSphereProviderSettingsComponent} from './vsphere-provider-settings/component';

describe('EditProviderSettingsComponent', () => {
  let fixture: ComponentFixture<EditProviderSettingsComponent>;
  let component: EditProviderSettingsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, SharedModule],
      declarations: [
        EditProviderSettingsComponent,
        AWSProviderSettingsComponent,
        DigitaloceanProviderSettingsComponent,
        HetznerProviderSettingsComponent,
        OpenstackProviderSettingsComponent,
        VSphereProviderSettingsComponent,
        AzureProviderSettingsComponent,
        EquinixProviderSettingsComponent,
        GCPProviderSettingsComponent,
        KubevirtProviderSettingsComponent,
        AlibabaProviderSettingsComponent,
      ],
      providers: [
        {provide: Router, useClass: RouterStub},
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: NotificationService, useClass: NotificationMockService},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProviderSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    fixture.detectChanges();
  });

  it('should create the edit provider settings cmp', () => {
    expect(component).toBeTruthy();
  });
});
