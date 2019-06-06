import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {AppConfigService} from '../../../../app-config.service';
import {ApiService, Auth, WizardService} from '../../../../core/services';
import {Config} from '../../../../shared/model/Config';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeOpenstackCluster} from '../../../../testing/fake-data/cluster.fake';
import {fakeOpenstackDatacenter} from '../../../../testing/fake-data/datacenter.fake';
import {openstackNetworksFake, openstackSecurityGroupsFake, openstackSortedFloatingIpsFake, openstackSortedNetworksFake, openstackSubnetIdsFake, openstackTenantsFake} from '../../../../testing/fake-data/wizard.fake';
import {asyncData} from '../../../../testing/services/api-mock.service';
import {AuthMockService} from '../../../../testing/services/auth-mock.service';

import {OpenstackClusterSettingsComponent} from './openstack.component';

import Spy = jasmine.Spy;

describe('OpenstackClusterSettingsComponent', () => {
  let fixture: ComponentFixture<OpenstackClusterSettingsComponent>;
  let component: OpenstackClusterSettingsComponent;
  let config: Config;
  let getSelectedDCSpyObj: Spy;
  let getOpenStackTenantsForWizard: Spy;
  let getOpenStackNetworkForWizard: Spy;
  let getOpenStackSecurityGroupsForWizard: Spy;
  let getOpenStackSubnetIdsForWizard: Spy;
  let apiMock;

  beforeEach(async(() => {
    apiMock = jasmine.createSpyObj('ApiService', [
      'getOpenStackTenantsForWizard', 'getOpenStackNetworkForWizard', 'getOpenStackSecurityGroupsForWizard',
      'getOpenStackSubnetIdsForWizard'
    ]);
    getOpenStackTenantsForWizard =
        apiMock.getOpenStackTenantsForWizard.and.returnValue(asyncData(openstackTenantsFake()));
    getOpenStackNetworkForWizard =
        apiMock.getOpenStackNetworkForWizard.and.returnValue(asyncData(openstackNetworksFake()));
    getOpenStackSecurityGroupsForWizard =
        apiMock.getOpenStackSecurityGroupsForWizard.and.returnValue(asyncData(openstackSecurityGroupsFake()));
    getOpenStackSubnetIdsForWizard =
        apiMock.getOpenStackSubnetIdsForWizard.and.returnValue(asyncData(openstackSubnetIdsFake()));
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
          ],
          declarations: [
            OpenstackClusterSettingsComponent,
          ],
          providers: [
            WizardService,
            {provide: ApiService, useValue: apiMock},
            {provide: Auth, useClass: AuthMockService},
            {provide: AppConfigService, useValue: appConfigServiceMock},
          ],
        })
        .compileComponents();
  }));

  describe('Default config', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(OpenstackClusterSettingsComponent);
      const wizardService: WizardService = TestBed.get(WizardService);
      getSelectedDCSpyObj = spyOn(wizardService, 'getSelectedDatacenter').and.returnValue(fakeOpenstackDatacenter());
      component = fixture.componentInstance;
      component.cluster = fakeOpenstackCluster();
      component.cluster.spec.cloud.openstack = {
        tenant: '',
        domain: '',
        network: '',
        securityGroups: '',
        floatingIpPool: '',
        password: '',
        username: '',
        subnetID: '',
      };
      component.clusterSpec = {
        cloudSpec: component.cluster.spec.cloud,
        valid: false,
      };
      fixture.detectChanges();
    });

    it('should create the openstack cluster cmp', () => {
      expect(component).toBeTruthy();
    });

    it('form invalid after creating', () => {
      expect(component.openstackSettingsForm.valid).toBeFalsy();
    });

    it('form has no default username after creating', () => {
      expect(component.openstackSettingsForm.get('username').value).toEqual('');
    });

    it('should show floating ip pool and make it required', () => {
      const dc = fakeOpenstackDatacenter();
      dc.spec.openstack.enforce_floating_ip = true;
      getSelectedDCSpyObj.and.returnValue(dc);

      fixture.detectChanges();
      const el = fixture.debugElement.query(By.css('#km-floating-ip-pool-field'));
      expect(el).not.toBeNull();
      expect(component.openstackSettingsForm.controls.floatingIpPool.hasError('required'));
    });

    it('should not load tenants', () => {
      component.openstackSettingsForm.controls.username.setValue('');
      component.openstackSettingsForm.controls.password.setValue('');
      component.openstackSettingsForm.controls.domain.setValue('');
      component.loadTenants();
      fixture.detectChanges();
      expect(component.tenants.length).toEqual(0);
    });

    it('should load tenants', fakeAsync(() => {
         component.openstackSettingsForm.controls.username.setValue('username');
         component.openstackSettingsForm.controls.password.setValue('password');
         component.openstackSettingsForm.controls.domain.setValue('domain');
         fixture.detectChanges();
         component.loadTenants();
         tick(1500);
         expect(getOpenStackTenantsForWizard.and.callThrough()).toHaveBeenCalled();
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
       }));

    it('should not load optional settings', () => {
      component.openstackSettingsForm.controls.username.setValue('');
      component.openstackSettingsForm.controls.password.setValue('');
      component.openstackSettingsForm.controls.domain.setValue('');
      component.openstackSettingsForm.controls.tenant.setValue('');
      component.loadOptionalSettings();
      fixture.detectChanges();
      expect(getOpenStackNetworkForWizard).toHaveBeenCalledTimes(0);
      expect(getOpenStackSecurityGroupsForWizard).toHaveBeenCalledTimes(0);
    });

    it('should load optional settings', fakeAsync(() => {
         component.openstackSettingsForm.controls.username.setValue('username');
         component.openstackSettingsForm.controls.password.setValue('password');
         component.openstackSettingsForm.controls.domain.setValue('domain');
         component.openstackSettingsForm.controls.tenant.setValue('loodse-poc');
         fixture.detectChanges();
         component.loadOptionalSettings();
         tick(1500);

         expect(getOpenStackNetworkForWizard).toHaveBeenCalled();
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
         expect(component.floatingIpPools).toEqual([
           {
             id: 'net789',
             name: 'ext-net',
             external: true,
           },
         ]);

         expect(getOpenStackSecurityGroupsForWizard).toHaveBeenCalled();
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
       }));

    it('should not load subnet ids', () => {
      component.openstackSettingsForm.controls.network.setValue('');
      component.loadSubnetIds();
      fixture.detectChanges();
      expect(component.subnetIds.length).toEqual(0);
      expect(getOpenStackSubnetIdsForWizard).toHaveBeenCalledTimes(0);
    });

    it('should load subnet ids', fakeAsync(() => {
         component.openstackSettingsForm.controls.network.setValue('test-network');
         fixture.detectChanges();
         component.loadSubnetIds();
         tick(1500);
         expect(getOpenStackSubnetIdsForWizard.and.callThrough()).toHaveBeenCalled();
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
       }));

    it('should set correct tenant placeholder', () => {
      component.openstackSettingsForm.controls.username.setValue('');
      component.loadingOptionalTenants = false;
      fixture.detectChanges();
      expect(component.getTenantsFormState()).toEqual('Project*');

      component.openstackSettingsForm.controls.username.setValue('username');
      component.openstackSettingsForm.controls.password.setValue('password');
      component.openstackSettingsForm.controls.domain.setValue('domain');
      component.loadingOptionalTenants = true;
      fixture.detectChanges();
      expect(component.getTenantsFormState()).toEqual('Loading Projects...');

      component.loadingOptionalTenants = false;
      component.tenants = [];
      fixture.detectChanges();
      expect(component.getTenantsFormState()).toEqual('No Projects available');

      component.tenants = openstackTenantsFake();
      fixture.detectChanges();
      expect(component.getTenantsFormState()).toEqual('Project*');
    });

    it('should set correct optional settings placeholder', () => {
      component.openstackSettingsForm.controls.tenant.setValue('');
      component.loadingOptionalSettings = false;
      fixture.detectChanges();
      expect(component.getOptionalSettingsFormState('Security Group')).toEqual('Security Group');

      component.openstackSettingsForm.controls.username.setValue('username');
      component.openstackSettingsForm.controls.password.setValue('password');
      component.openstackSettingsForm.controls.domain.setValue('domain');
      component.openstackSettingsForm.controls.tenant.setValue('tenant');
      component.loadingOptionalSettings = true;
      fixture.detectChanges();
      expect(component.getOptionalSettingsFormState('Security Group')).toEqual('Loading Security Groups...');

      component.loadingOptionalSettings = false;
      component.floatingIpPools = [];
      component.securityGroups = [];
      component.networks = [];
      fixture.detectChanges();
      expect(component.getOptionalSettingsFormState('Floating IP Pool')).toEqual('No Floating IP Pools available');
      expect(component.getOptionalSettingsFormState('Security Group')).toEqual('No Security Groups available');
      expect(component.getOptionalSettingsFormState('Network')).toEqual('No Networks available');

      component.floatingIpPools = openstackSortedFloatingIpsFake();
      component.securityGroups = openstackSecurityGroupsFake();
      component.networks = openstackSortedNetworksFake();
      fixture.detectChanges();
      expect(component.getOptionalSettingsFormState('Floating IP Pool')).toEqual('Floating IP Pool');
      expect(component.getOptionalSettingsFormState('Security Group')).toEqual('Security Group');
      expect(component.getOptionalSettingsFormState('Network')).toEqual('Network');
    });

    it('should set correct subnet id placeholder', () => {
      component.openstackSettingsForm.controls.network.setValue('');
      component.loadingSubnetIds = false;
      fixture.detectChanges();
      expect(component.getSubnetIDFormState()).toEqual('Subnet ID');

      component.openstackSettingsForm.controls.username.setValue('username');
      component.openstackSettingsForm.controls.password.setValue('password');
      component.openstackSettingsForm.controls.domain.setValue('domain');
      component.openstackSettingsForm.controls.tenant.setValue('tenant');
      component.openstackSettingsForm.controls.network.setValue('network');
      component.loadingSubnetIds = true;
      fixture.detectChanges();
      expect(component.getSubnetIDFormState()).toEqual('Loading Subnet IDs...');

      component.loadingSubnetIds = false;
      component.subnetIds = [];
      fixture.detectChanges();
      expect(component.getSubnetIDFormState()).toEqual('No Subnet IDs available');

      component.subnetIds = openstackSubnetIdsFake();
      fixture.detectChanges();
      expect(component.getSubnetIDFormState()).toEqual('Subnet ID');
    });
  });

  describe('Config with DefaultUserName', () => {
    beforeEach(() => {
      config.openstack = {
        wizard_use_default_user: true,
      };

      fixture = TestBed.createComponent(OpenstackClusterSettingsComponent);
      const wizardService: WizardService = TestBed.get(WizardService);
      spyOn(wizardService, 'getSelectedDatacenter').and.returnValue(fakeOpenstackDatacenter());
      component = fixture.componentInstance;
      component.cluster = fakeOpenstackCluster();
      component.cluster.spec.cloud.openstack = {
        tenant: '',
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
      expect(component.openstackSettingsForm.get('username').value).toEqual('testUser');
    });
  });
});
