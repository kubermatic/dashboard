import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { OpenstackClusterSettingsComponent } from './openstack.component';
import { SharedModule } from '../../../../shared/shared.module';
import { WizardService, ApiService, Auth } from '../../../../core/services';
import { asyncData } from '../../../../testing/services/api-mock.service';
import { fakeOpenstackCluster } from '../../../../testing/fake-data/cluster.fake';
import { openstackTenantsFake } from '../../../../testing/fake-data/wizard.fake';
import { AuthMockService } from '../../../../testing/services/auth-mock.service';
import Spy = jasmine.Spy;
import { AppConfigService } from '../../../../app-config.service';
import { Config } from '../../../../shared/model/Config';

describe('OpenstackClusterSettingsComponent', () => {
  let fixture: ComponentFixture<OpenstackClusterSettingsComponent>;
  let component: OpenstackClusterSettingsComponent;
  let getOpenStackTenantsSpy: Spy;
  let config: Config;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getOpenStackTenants']);
    getOpenStackTenantsSpy = apiMock.getOpenStackTenants.and.returnValue(asyncData(openstackTenantsFake));
    const appConfigServiceMock = jasmine.createSpyObj('AppConfigService', ['getConfig']);
    config = new class implements Config {};
    appConfigServiceMock.getConfig.and.returnValue(config);

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        SharedModule
      ],
      declarations: [
        OpenstackClusterSettingsComponent
      ],
      providers: [
        WizardService,
        { provide: ApiService, useValue: apiMock },
        { provide: Auth, useClass: AuthMockService },
        { provide: AppConfigService, useValue: appConfigServiceMock },
      ],
    }).compileComponents();
  }));

  describe('Default config', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(OpenstackClusterSettingsComponent);
      component = fixture.componentInstance;
      component.cluster = fakeOpenstackCluster;
      component.cluster.spec.cloud.openstack = {
        tenant: '',
        domain: '',
        network: '',
        securityGroups: '',
        floatingIpPool: '',
        password: '',
        username: '',
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
  });

  describe('Config with DefaultUserName', () => {
    beforeEach(() => {
      config.openstack = {
        wizard_use_default_user: true
      };

      fixture = TestBed.createComponent(OpenstackClusterSettingsComponent);
      component = fixture.componentInstance;
      component.cluster = fakeOpenstackCluster;
      component.cluster.spec.cloud.openstack = {
        tenant: '',
        domain: '',
        network: '',
        securityGroups: '',
        floatingIpPool: '',
        password: '',
        username: '',
      };
      fixture.detectChanges();
    });

    it('form has default username after creating if config is set', () => {
      expect(component.openstackSettingsForm.get('username').value).toEqual('testUser');
    });
  });
});
