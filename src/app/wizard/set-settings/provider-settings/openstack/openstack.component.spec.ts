import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {AppConfigService} from '../../../../app-config.service';
import {ApiService, Auth, WizardService} from '../../../../core/services';
import {Config} from '../../../../shared/model/Config';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeOpenstackCluster} from '../../../../testing/fake-data/cluster.fake';
import {fakeOpenstackDatacenter} from '../../../../testing/fake-data/datacenter.fake';
import {openstackTenantsFake} from '../../../../testing/fake-data/wizard.fake';
import {asyncData} from '../../../../testing/services/api-mock.service';
import {AuthMockService} from '../../../../testing/services/auth-mock.service';

import {OpenstackClusterSettingsComponent} from './openstack.component';
import Spy = jasmine.Spy;

describe('OpenstackClusterSettingsComponent', () => {
  let fixture: ComponentFixture<OpenstackClusterSettingsComponent>;
  let component: OpenstackClusterSettingsComponent;
  let config: Config;
  let getSelectedDCSpyObj: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getOpenStackTenants']);
    apiMock.getOpenStackTenants.and.returnValue(asyncData(openstackTenantsFake()));
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
