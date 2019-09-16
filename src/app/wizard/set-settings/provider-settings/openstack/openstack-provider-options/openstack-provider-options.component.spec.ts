import {HttpClientModule} from '@angular/common/http';
import {EventEmitter} from '@angular/core';
import {async, ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {AppConfigService} from '../../../../../app-config.service';
import {Auth, WizardService} from '../../../../../core/services';
import {ClusterSettingsFormView} from '../../../../../shared/model/ClusterForm';
import {Config} from '../../../../../shared/model/Config';
import {NodeProvider} from '../../../../../shared/model/NodeProviderConstants';
import {SharedModule} from '../../../../../shared/shared.module';
import {fakeOpenstackCluster} from '../../../../../testing/fake-data/cluster.fake';
import {fakeOpenstackDatacenter} from '../../../../../testing/fake-data/datacenter.fake';
import {openstackNetworksFake, openstackSecurityGroupsFake, openstackSortedNetworksFake, openstackSubnetIdsFake, openstackTenantsFake} from '../../../../../testing/fake-data/wizard.fake';
import {asyncData} from '../../../../../testing/services/api-mock.service';
import {AuthMockService} from '../../../../../testing/services/auth-mock.service';

import {OpenstackProviderOptionsComponent} from './openstack-provider-options.component';
import Spy = jasmine.Spy;

describe('OpenstackProviderOptionsComponent', () => {
  let fixture: ComponentFixture<OpenstackProviderOptionsComponent>;
  let component: OpenstackProviderOptionsComponent;
  let config: Config;
  let networksMock: Spy;
  let securityGroupsMock: Spy;
  let subnetIdsMock: Spy;
  let wizardMock;
  let providerMock;

  beforeEach(async(() => {
    wizardMock =
        jasmine.createSpyObj('WizardService', ['provider', 'getSelectedDatacenter', 'changeClusterProviderSettings']);
    providerMock = jasmine.createSpyObj('Provider', [
      'tenants', 'networks', 'securityGroups', 'subnets', 'username', 'password', 'domain', 'datacenter', 'tenant',
      'tenantID'
    ]);

    wizardMock.changeClusterProviderSettings.and.callThrough();
    wizardMock.onCustomPresetsDisable = new EventEmitter<boolean>();
    wizardMock.onCustomPresetSelect = new EventEmitter<string>();
    wizardMock.clusterSettingsFormViewChanged$ = new EventEmitter<ClusterSettingsFormView>();

    providerMock.username.and.returnValue(providerMock);
    providerMock.password.and.returnValue(providerMock);
    providerMock.domain.and.returnValue(providerMock);
    providerMock.datacenter.and.returnValue(providerMock);
    providerMock.tenant.and.returnValue(providerMock);
    providerMock.tenantID.and.returnValue(providerMock);

    wizardMock.getSelectedDatacenter.and.returnValue(fakeOpenstackDatacenter());

    wizardMock.provider.withArgs(NodeProvider.OPENSTACK).and.returnValue(providerMock);
    providerMock.tenants.and.returnValue(asyncData(openstackTenantsFake()));

    networksMock = wizardMock.provider.withArgs(NodeProvider.OPENSTACK).and.returnValue(providerMock);
    providerMock.networks.and.returnValue(asyncData(openstackNetworksFake()));

    securityGroupsMock = wizardMock.provider.withArgs(NodeProvider.OPENSTACK).and.returnValue(providerMock);
    providerMock.securityGroups.and.returnValue(asyncData(openstackSecurityGroupsFake()));

    subnetIdsMock = wizardMock.provider.withArgs(NodeProvider.OPENSTACK).and.returnValue(providerMock);
    providerMock.subnets.and.returnValue(asyncData(openstackSubnetIdsFake()));

    const appConfigServiceMock = jasmine.createSpyObj('AppConfigService', ['getConfig']);
    config = {} as Config;
    appConfigServiceMock.getConfig.and.returnValue(config);

    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            ReactiveFormsModule,
            SharedModule,
            HttpClientModule,
          ],
          declarations: [
            OpenstackProviderOptionsComponent,
          ],
          providers: [
            {provide: WizardService, useValue: wizardMock},
            {provide: Auth, useClass: AuthMockService},
            {provide: AppConfigService, useValue: appConfigServiceMock},
          ],
        })
        .compileComponents();
  }));

  describe('Default config', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(OpenstackProviderOptionsComponent);
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

    it('should not load optional settings', () => {
      component.cluster.spec.cloud.openstack.username = '';
      component.cluster.spec.cloud.openstack.password = '';
      component.cluster.spec.cloud.openstack.domain = '';
      component.cluster.spec.cloud.openstack.tenant = '';
      fixture.detectChanges();
      expect(networksMock).toHaveBeenCalledTimes(0);
      expect(securityGroupsMock).toHaveBeenCalledTimes(0);
    });

    it('should load optional settings', fakeAsync(() => {
         component.cluster.spec.cloud.openstack.username = 'username';
         component.cluster.spec.cloud.openstack.password = 'password';
         component.cluster.spec.cloud.openstack.domain = 'domain';
         component.cluster.spec.cloud.openstack.tenant = 'loodse-poc';
         component.networks = [];
         component.securityGroups = [];
         fixture.detectChanges();
         tick(1001);

         expect(networksMock).toHaveBeenCalled();
         expect(component.networks).toEqual([
           {
             id: 'net456',
             name: 'ext-net',
             external: false,
           },
           {
             id: 'net123',
             name: 'test-network',
             external: false,
           },
         ]);

         expect(securityGroupsMock).toHaveBeenCalled();
         expect(component.securityGroups).toEqual([
           {
             id: 'sg456',
             name: 'another-security-group',
           },
           {
             id: 'sg123',
             name: 'test-security-group',
           },
         ]);
         discardPeriodicTasks();
       }));

    it('should not load subnet ids', () => {
      component.form.controls.network.setValue('');
      fixture.detectChanges();
      expect(component.subnetIds.length).toEqual(0);
      expect(subnetIdsMock).toHaveBeenCalledTimes(0);
    });

    it('should load subnet ids', fakeAsync(() => {
         component.networks = [];
         component.securityGroups = [];

         component.cluster.spec.cloud.openstack.username = 'username';
         component.cluster.spec.cloud.openstack.password = 'password';
         component.cluster.spec.cloud.openstack.domain = 'domain';
         fixture.detectChanges();
         tick(1001);

         component.cluster.spec.cloud.openstack.tenant = 'loodse-poc';
         fixture.detectChanges();
         tick(1001);

         component.form.controls.network.setValue('network');
         component.cluster.spec.cloud.openstack.tenant = 'loodse-poc';
         fixture.detectChanges();
         tick(1001);

         expect(subnetIdsMock).toHaveBeenCalled();
         expect(component.subnetIds).toEqual([
           {
             id: 'sub456',
             name: 'another-subnet',
           },
           {
             id: 'sub123',
             name: 'test-subnet',
           },
         ]);
         discardPeriodicTasks();
       }));

    it('should set correct optional settings placeholder', (() => {
         component.form.controls.tenant.setValue('');
         fixture.detectChanges();
         expect(component.getOptionalSettingsFormState('Security Group')).toEqual('Security Group');

         component.cluster.spec.cloud.openstack.username = 'username';
         component.cluster.spec.cloud.openstack.password = 'password';
         component.cluster.spec.cloud.openstack.domain = 'domain';
         component.cluster.spec.cloud.openstack.tenant = 'tenant';
         component.securityGroups = [];
         component.networks = [];
         fixture.detectChanges();
         expect(component.getOptionalSettingsFormState('Security Group')).toEqual('No Security Groups available');
         expect(component.getOptionalSettingsFormState('Network')).toEqual('No Networks available');

         component.securityGroups = openstackSecurityGroupsFake();
         component.networks = openstackSortedNetworksFake();
         fixture.detectChanges();
         expect(component.getOptionalSettingsFormState('Security Group')).toEqual('Security Group');
         expect(component.getOptionalSettingsFormState('Network')).toEqual('Network');
       }));

    it('should set correct subnet id placeholder', fakeAsync(() => {
         component.form.controls.network.setValue('');
         fixture.detectChanges();
         expect(component.getSubnetIDFormState()).toEqual('Subnet ID');

         component.cluster.spec.cloud.openstack.username = 'username';
         component.cluster.spec.cloud.openstack.password = 'password';
         component.cluster.spec.cloud.openstack.domain = 'domain';

         fixture.detectChanges();
         tick(2001);

         component.cluster.spec.cloud.openstack.tenant = 'tenant';
         component.form.controls.network.setValue('network');
         component.subnetIds = [];

         expect(component.getSubnetIDFormState()).toEqual('Loading Subnet IDs...');

         component.subnetIds = openstackSubnetIdsFake();
         fixture.detectChanges();
         tick(2001);

         expect(component.getSubnetIDFormState()).toEqual('Subnet ID');
       }));
  });
});
