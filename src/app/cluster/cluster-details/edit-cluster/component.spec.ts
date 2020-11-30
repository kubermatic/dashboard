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

import {EventEmitter} from '@angular/core';
import {ComponentFixture, fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {doPatchCloudSpecFake} from '@app/testing/fake-data/cloud-spec.fake';
import {fakeDigitaloceanCluster} from '@app/testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '@app/testing/fake-data/datacenter.fake';
import {fakeProject} from '@app/testing/fake-data/project.fake';
import {RouterStub} from '@app/testing/router-stubs';
import {ApiMockService, asyncData} from '@app/testing/services/api-mock.service';
import {AppConfigMockService} from '@app/testing/services/app-config-mock.service';
import {DatacenterMockService} from '@app/testing/services/datacenter-mock.service';
import {MatDialogRefMock} from '@app/testing/services/mat-dialog-ref-mock';
import {UserMockService} from '@app/testing/services/user-mock.service';
import {CoreModule} from '@core/module';
import {ApiService} from '@core/services/api/service';
import {ClusterService} from '@core/services/cluster/service';
import {DatacenterService} from '@core/services/datacenter/service';
import {UserService} from '@core/services/user/service';
import {ProviderSettingsPatch} from '@shared/entity/cluster';
import {SharedModule} from '@shared/shared.module';
import {Subject} from 'rxjs';
import {AlibabaProviderSettingsComponent} from '../edit-provider-settings/alibaba-provider-settings/component';
import {AWSProviderSettingsComponent} from '../edit-provider-settings/aws-provider-settings/component';
import {AzureProviderSettingsComponent} from '../edit-provider-settings/azure-provider-settings/component';
import {DigitaloceanProviderSettingsComponent} from '../edit-provider-settings/digitalocean-provider-settings/component';
import {EditProviderSettingsComponent} from '../edit-provider-settings/component';
import {GCPProviderSettingsComponent} from '../edit-provider-settings/gcp-provider-settings/component';
import {HetznerProviderSettingsComponent} from '../edit-provider-settings/hetzner-provider-settings/component';
import {KubevirtProviderSettingsComponent} from '../edit-provider-settings/kubevirt-provider-settings/component';
import {OpenstackProviderSettingsComponent} from '../edit-provider-settings/openstack-provider-settings/component';
import {PacketProviderSettingsComponent} from '../edit-provider-settings/packet-provider-settings/component';
import {VSphereProviderSettingsComponent} from '../edit-provider-settings/vsphere-provider-settings/component';
import {EditClusterComponent} from './component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule];

describe('EditClusterComponent', () => {
  let fixture: ComponentFixture<EditClusterComponent>;
  let component: EditClusterComponent;
  let editClusterSpy;

  beforeEach(
    waitForAsync(() => {
      const clusterServiceMock = {
        patch: jest.fn(),
        changeProviderSettingsPatch: jest.fn(),
        providerSettingsPatchChanges$: new EventEmitter<ProviderSettingsPatch>(),
        onClusterUpdate: new Subject<void>(),
      };
      editClusterSpy = clusterServiceMock.patch.mockReturnValue(asyncData(fakeDigitaloceanCluster()));

      TestBed.configureTestingModule({
        imports: [...modules],
        declarations: [
          EditClusterComponent,
          EditProviderSettingsComponent,
          AWSProviderSettingsComponent,
          DigitaloceanProviderSettingsComponent,
          HetznerProviderSettingsComponent,
          OpenstackProviderSettingsComponent,
          VSphereProviderSettingsComponent,
          AzureProviderSettingsComponent,
          PacketProviderSettingsComponent,
          GCPProviderSettingsComponent,
          KubevirtProviderSettingsComponent,
          AlibabaProviderSettingsComponent,
        ],
        providers: [
          {provide: DatacenterService, useClass: DatacenterMockService},
          {provide: MatDialogRef, useClass: MatDialogRefMock},
          {provide: ClusterService, useValue: clusterServiceMock},
          {provide: ApiService, useClass: ApiMockService},
          {provide: AppConfigService, useClass: AppConfigMockService},
          {provide: UserService, useClass: UserMockService},
          {provide: Router, useClass: RouterStub},
        ],
      }).compileComponents();
    })
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(EditClusterComponent);
      component = fixture.componentInstance;
      component.cluster = fakeDigitaloceanCluster();
      component.datacenter = fakeDigitaloceanDatacenter();
      component.projectID = fakeProject().id;
      component.labels = {};
      component.asyncLabelValidators = [];
      fixture.detectChanges();
    })
  );

  it(
    'should create the edit cluster component',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it('should have valid form after creating', () => {
    expect(component.form.valid).toBeTruthy();
  });

  it('should have required fields', () => {
    component.form.controls.name.patchValue('');
    expect(component.form.valid).toBeFalsy();
    expect(component.form.controls.name.valid).toBeFalsy();
    expect(component.form.controls.name.hasError('required')).toBeTruthy();

    component.form.controls.name.patchValue('new-cluster-name');
    expect(component.form.controls.name.hasError('required')).toBeFalsy();
  });

  it('should call editCluster method', fakeAsync(() => {
    component.providerSettingsPatch = doPatchCloudSpecFake();
    fixture.detectChanges();

    component.form.controls.name.patchValue('new-cluster-name');
    component.editCluster();
    tick();

    expect(editClusterSpy).toHaveBeenCalled();
  }));
});
