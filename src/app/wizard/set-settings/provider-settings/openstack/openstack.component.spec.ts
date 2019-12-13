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
import {NodeProvider} from '../../../../shared/model/NodeProviderConstants';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeOpenstackCluster} from '../../../../testing/fake-data/cluster.fake';
import {fakeOpenstackDatacenter} from '../../../../testing/fake-data/datacenter.fake';
import {openstackNetworksFake, openstackSecurityGroupsFake, openstackSubnetIdsFake, openstackTenantsFake} from '../../../../testing/fake-data/wizard.fake';
import {asyncData} from '../../../../testing/services/api-mock.service';
import {AuthMockService} from '../../../../testing/services/auth-mock.service';

import {OpenstackClusterSettingsComponent} from './openstack.component';

import Spy = jasmine.Spy;

describe('OpenstackClusterSettingsComponent', () => {
  let fixture: ComponentFixture<OpenstackClusterSettingsComponent>;
  let component: OpenstackClusterSettingsComponent;
  let config: Config;
  let tenantsMock: Spy;
  let networksMock: Spy;
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
    wizardMock.clusterProviderSettingsFormChanges$ = new EventEmitter<ClusterProviderSettingsForm>();

    providerMock.username.and.returnValue(providerMock);
    providerMock.password.and.returnValue(providerMock);
    providerMock.domain.and.returnValue(providerMock);
    providerMock.datacenter.and.returnValue(providerMock);
    providerMock.tenant.and.returnValue(providerMock);
    providerMock.tenantID.and.returnValue(providerMock);

    wizardMock.getSelectedDatacenter.and.returnValue(fakeOpenstackDatacenter());

    tenantsMock = wizardMock.provider.withArgs(NodeProvider.OPENSTACK).and.returnValue(providerMock);
    providerMock.tenants.and.returnValue(asyncData(openstackTenantsFake()));

    networksMock = wizardMock.provider.withArgs(NodeProvider.OPENSTACK).and.returnValue(providerMock);
    providerMock.networks.and.returnValue(asyncData(openstackNetworksFake()));

    wizardMock.provider.withArgs(NodeProvider.OPENSTACK).and.returnValue(providerMock);
    providerMock.securityGroups.and.returnValue(asyncData(openstackSecurityGroupsFake()));

    wizardMock.provider.withArgs(NodeProvider.OPENSTACK).and.returnValue(providerMock);
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
            OpenstackClusterSettingsComponent,
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
      wizardMock.getSelectedDatacenter.and.returnValue(dc);

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
         expect(tenantsMock.and.callThrough()).toHaveBeenCalled();
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
