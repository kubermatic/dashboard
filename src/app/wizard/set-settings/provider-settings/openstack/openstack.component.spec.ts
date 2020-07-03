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
import {EventEmitter} from '@angular/core';
import {async, ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {AppConfigService} from '../../../../app-config.service';
import {Auth, WizardService} from '../../../../core/services';
import {ClusterProviderSettingsForm, ClusterSettingsFormView} from '../../../../shared/model/ClusterForm';
import {Config} from '../../../../shared/model/Config';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeOpenstackCluster} from '../../../../testing/fake-data/cluster.fake';
import {fakeOpenstackDatacenter} from '../../../../testing/fake-data/datacenter.fake';
import {
  openstackNetworksFake,
  openstackSecurityGroupsFake,
  openstackSubnetIdsFake,
  openstackTenantsFake,
} from '../../../../testing/fake-data/wizard.fake';
import {asyncData} from '../../../../testing/services/api-mock.service';
import {AuthMockService} from '../../../../testing/services/auth-mock.service';

import {OpenstackClusterSettingsComponent} from './openstack.component';

describe('OpenstackClusterSettingsComponent', () => {
  let fixture: ComponentFixture<OpenstackClusterSettingsComponent>;
  let component: OpenstackClusterSettingsComponent;
  let config: Config;
  let tenantsMock;
  let networksMock;
  let wizardMock;
  let providerMock;

  beforeEach(async(() => {
    wizardMock = {
      provider: jest.fn(),
      getSelectedDatacenter: jest.fn(),
      changeClusterProviderSettings: jest.fn(),
    };

    providerMock = {
      tenants: jest.fn(),
      networks: jest.fn(),
      securityGroups: jest.fn(),
      subnets: jest.fn(),
      username: jest.fn(),
      password: jest.fn(),
      domain: jest.fn(),
      datacenter: jest.fn(),
      tenant: jest.fn(),
      tenantID: jest.fn(),
    };

    wizardMock.onCustomPresetsDisable = new EventEmitter<boolean>();
    wizardMock.onCustomPresetSelect = new EventEmitter<string>();
    wizardMock.clusterSettingsFormViewChanged$ = new EventEmitter<ClusterSettingsFormView>();
    wizardMock.clusterProviderSettingsFormChanges$ = new EventEmitter<ClusterProviderSettingsForm>();

    providerMock.username.mockReturnValue(providerMock);
    providerMock.password.mockReturnValue(providerMock);
    providerMock.domain.mockReturnValue(providerMock);
    providerMock.datacenter.mockReturnValue(providerMock);
    providerMock.tenant.mockReturnValue(providerMock);
    providerMock.tenantID.mockReturnValue(providerMock);

    wizardMock.getSelectedDatacenter.mockReturnValue(fakeOpenstackDatacenter());

    tenantsMock = wizardMock.provider.mockReturnValue(providerMock);
    providerMock.tenants.mockReturnValue(asyncData(openstackTenantsFake()));

    networksMock = wizardMock.provider.mockReturnValue(providerMock);
    providerMock.networks.mockReturnValue(asyncData(openstackNetworksFake()));

    wizardMock.provider.mockReturnValue(providerMock);
    providerMock.securityGroups.mockReturnValue(asyncData(openstackSecurityGroupsFake()));

    wizardMock.provider.mockReturnValue(providerMock);
    providerMock.subnets.mockReturnValue(asyncData(openstackSubnetIdsFake()));

    const appConfigServiceMock = {getConfig: jest.fn()};
    config = {} as Config;
    appConfigServiceMock.getConfig.mockReturnValue(config);

    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
      declarations: [OpenstackClusterSettingsComponent],
      providers: [
        {provide: WizardService, useValue: wizardMock},
        {provide: Auth, useClass: AuthMockService},
        {provide: AppConfigService, useValue: appConfigServiceMock},
      ],
    }).compileComponents();
  }));

  describe('Default config', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(OpenstackClusterSettingsComponent);
      component = fixture.componentInstance;
      component.cluster = fakeOpenstackCluster();
      component.cluster.spec.cloud.openstack = {
        tenant: '',
        tenantID: '',
        domain: '',
        network: '',
        securityGroups: '',
        floatingIpPool: '',
        password: '',
        username: '',
        subnetID: '',
      };
      fixture.detectChanges();
    });

    it('should create the openstack cluster cmp', () => {
      expect(component).toBeTruthy();
    });

    it('form invalid after creating', () => {
      expect(component.form.valid).toBeFalsy();
    });

    it('form has no default username after creating', () => {
      expect(component.form.get('username').value).toEqual('');
    });

    it('should show floating ip pool and make it required', () => {
      const dc = fakeOpenstackDatacenter();
      dc.spec.openstack.enforce_floating_ip = true;
      wizardMock.getSelectedDatacenter.mockReturnValue(dc);

      fixture.detectChanges();
      const el = fixture.debugElement.query(By.css('#km-floating-ip-pool-field'));
      expect(el).not.toBeNull();
      expect(component.form.controls.floatingIpPool.hasError('required'));
    });

    it('should not load tenants', () => {
      component.form.controls.username.setValue('');
      component.form.controls.password.setValue('');
      component.form.controls.domain.setValue('');
      fixture.detectChanges();
      expect(component.tenants.length).toEqual(0);
    });

    it('should load tenants', fakeAsync(() => {
      component.form.controls.username.setValue('username');
      component.form.controls.password.setValue('password');
      component.form.controls.domain.setValue('domain');
      fixture.detectChanges();
      tick(1001);
      expect(tenantsMock).toHaveBeenCalled();
      expect(component.tenants).toEqual([
        {
          id: 'id789',
          name: 'another-loodse-poc',
        },
        {
          id: 'id123',
          name: 'loodse-poc',
        },
        {
          id: 'id456',
          name: 'loodse-poc2',
        },
      ]);
      discardPeriodicTasks();
    }));

    it('should load optional settings', fakeAsync(() => {
      component.form.controls.username.setValue('username');
      component.form.controls.password.setValue('password');
      component.form.controls.domain.setValue('domain');
      component.form.controls.tenant.setValue('loodse-poc');
      component.floatingIpPools = [];
      fixture.detectChanges();
      tick(1001);

      expect(networksMock).toHaveBeenCalled();
      expect(component.floatingIpPools).toEqual([
        {
          id: 'net789',
          name: 'ext-net',
          external: true,
        },
      ]);
      discardPeriodicTasks();
    }));

    it('should set correct tenant placeholder', () => {
      component.form.controls.username.setValue('');
      fixture.detectChanges();
      expect(component.getTenantsFormState()).toEqual('Project');

      component.form.controls.username.setValue('username');
      component.form.controls.password.setValue('password');
      component.form.controls.domain.setValue('domain');
      component.tenants = [];
      fixture.detectChanges();
      expect(component.getTenantsFormState()).toEqual('No Projects available');

      component.tenants = openstackTenantsFake();
      fixture.detectChanges();
      expect(component.getTenantsFormState()).toEqual('Project');
    });

    it('should disable Project field when Project ID is provided', fakeAsync(() => {
      fixture.detectChanges();

      expect(component.form.controls.tenant.disabled).toBeTruthy();
      expect(component.form.controls.tenantID.disabled).toBeTruthy();

      component.form.controls.username.setValue('username');
      component.form.controls.password.setValue('password');
      component.form.controls.domain.setValue('domain');
      component.form.controls.tenantID.setValue('tenantID');
      fixture.detectChanges();
      tick(2001);

      expect(component.form.controls.tenant.disabled).toBeTruthy();
      expect(component.form.controls.tenantID.enabled).toBeTruthy();
      discardPeriodicTasks();
    }));

    it('should disable Project ID field when Project is provided', fakeAsync(() => {
      fixture.detectChanges();

      expect(component.form.controls.tenant.disabled).toBeTruthy();
      expect(component.form.controls.tenantID.disabled).toBeTruthy();

      component.form.controls.username.setValue('username');
      component.form.controls.password.setValue('password');
      component.form.controls.domain.setValue('domain');
      component.form.controls.tenant.setValue('test-project');
      component.tenants = [{id: 'test-id', name: 'test-project'}];
      fixture.detectChanges();
      tick(1001);

      expect(component.form.controls.tenant.enabled).toBeTruthy();
      expect(component.form.controls.tenantID.disabled).toBeTruthy();
      discardPeriodicTasks();
    }));
  });

  describe('Config with DefaultUserName', () => {
    beforeEach(() => {
      config.openstack = {
        wizard_use_default_user: true,
      };

      fixture = TestBed.createComponent(OpenstackClusterSettingsComponent);
      component = fixture.componentInstance;
      component.cluster = fakeOpenstackCluster();
      component.cluster.spec.cloud.openstack = {
        tenant: '',
        tenantID: '',
        domain: '',
        network: '',
        securityGroups: '',
        floatingIpPool: '',
        password: '',
        username: '',
        subnetID: '',
      };
      fixture.detectChanges();
    });

    it('form has default username after creating if config is set', () => {
      expect(component.form.get('username').value).toEqual('testUser');
    });
  });
});
