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

import {EventEmitter} from '@angular/core';
import {ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {doPatchCloudSpecFake} from '@test/data/cloud-spec';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeDigitaloceanDatacenter} from '@test/data/datacenter';
import {fakeProject} from '@test/data/project';
import {RouterStub} from '@test/services/router-stubs';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {DatacenterMockService} from '@test/services/datacenter-mock';
import {SettingsMockService} from '@test/services/settings-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {UserMockService} from '@test/services/user-mock';
import {CoreModule} from '@core/module';
import {ClusterService} from '@core/services/cluster';
import {DatacenterService} from '@core/services/datacenter';
import {UserService} from '@core/services/user';
import {SettingsService} from '@core/services/settings';
import {ClusterSpec, CNIPlugin, ProviderSettingsPatch} from '@shared/entity/cluster';
import {SharedModule} from '@shared/module';
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
import {EquinixProviderSettingsComponent} from '../edit-provider-settings/equinix-provider-settings/component';
import {VSphereProviderSettingsComponent} from '../edit-provider-settings/vsphere-provider-settings/component';
import {EventRateLimitComponent} from '@shared/components/event-rate-limit/component';
import {EditClusterComponent} from './component';
import {FeatureGateService} from '@core/services/feature-gate';
import {FeatureGatesMockService} from '@test/services/feature-gate-mock';
import {asyncData} from '@test/services/cluster-mock';

describe('EditClusterComponent', () => {
  let fixture: ComponentFixture<EditClusterComponent>;
  let component: EditClusterComponent;
  let editClusterSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const clusterServiceMock = {
      patch: jest.fn(),
      changeProviderSettingsPatch: jest.fn(),
      providerSettingsPatchChanges$: new EventEmitter<ProviderSettingsPatch>(),
      onClusterUpdate: new Subject<void>(),
      getAdmissionPlugins: jest.fn(),
    };
    editClusterSpy = clusterServiceMock.patch.mockReturnValue(asyncData(fakeDigitaloceanCluster()));
    clusterServiceMock.getAdmissionPlugins.mockReturnValue(asyncData([]));

    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule],
      declarations: [
        EditClusterComponent,
        EditProviderSettingsComponent,
        EventRateLimitComponent,
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
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: ClusterService, useValue: clusterServiceMock},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: FeatureGateService, useClass: FeatureGatesMockService},
        {provide: Router, useClass: RouterStub},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditClusterComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    component.datacenter = fakeDigitaloceanDatacenter();
    component.projectID = fakeProject().id;
    component.labels = {};
    component.asyncLabelValidators = [];
    fixture.detectChanges();
  });

  it('should create the edit cluster component', () => {
    expect(component).toBeTruthy();
  });

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

  xit('should call editCluster method', fakeAsync(() => {
    component.providerSettingsPatch = doPatchCloudSpecFake();
    fixture.detectChanges();

    component.form.controls.name.patchValue('new-cluster-name');
    // component.editCluster();
    tick();
    flush();

    expect(editClusterSpy).toHaveBeenCalled();
  }));

  describe('Konnectivity control', () => {
    let spec: ClusterSpec;
    const setClusterAndRunNgOnInit = (spec: ClusterSpec) => {
      component.cluster.spec = spec;

      component.ngOnInit();
    };

    beforeEach(() => {
      spec = component.cluster.spec;
    });

    it('should be disabled when initial Konnectivity value is true', () => {
      setClusterAndRunNgOnInit({
        ...spec,
        clusterNetwork: {
          ...spec.clusterNetwork,
          konnectivityEnabled: true,
        },
        cniPlugin: {
          ...spec.cniPlugin,
          type: CNIPlugin.Cilium,
        },
      });

      expect(component.form.get(component.Controls.Konnectivity).disabled).toBeTruthy();
    });

    it('should not be disabled when initial Konnectivity value is false', () => {
      setClusterAndRunNgOnInit({
        ...spec,
        clusterNetwork: {
          ...spec.clusterNetwork,
          konnectivityEnabled: false,
        },
        cniPlugin: {
          ...spec.cniPlugin,
          type: CNIPlugin.Cilium,
        },
      });

      expect(component.form.get(component.Controls.Konnectivity).disabled).toBeFalsy();
    });
  });
});
