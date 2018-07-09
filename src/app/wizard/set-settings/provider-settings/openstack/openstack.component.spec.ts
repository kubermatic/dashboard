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

describe('OpenstackClusterSettingsComponent', () => {
  let fixture: ComponentFixture<OpenstackClusterSettingsComponent>;
  let component: OpenstackClusterSettingsComponent;
  let getOpenStackTenantsSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getOpenStackTenants']);
    getOpenStackTenantsSpy = apiMock.getOpenStackTenants.and.returnValue(asyncData(openstackTenantsFake));

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
      ],
    }).compileComponents();
  }));

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

  it('form has default username after creating', () => {
    expect(component.openstackSettingsForm.get('username').value).toEqual('testUser');
  });
});
