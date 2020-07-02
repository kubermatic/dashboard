import {HttpClientModule} from '@angular/common/http';
import {EventEmitter} from '@angular/core';
import {async, ComponentFixture, discardPeriodicTasks, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {WizardService} from '../../../../../core/services';
import {ClusterProviderSettingsForm, ClusterSettingsFormView} from '../../../../../shared/model/ClusterForm';
import {SharedModule} from '../../../../../shared/shared.module';
import {fakeOpenstackCluster} from '../../../../../testing/fake-data/cluster.fake';
import {
  openstackNetworksFake,
  openstackSecurityGroupsFake,
  openstackSortedNetworksFake,
  openstackSubnetIdsFake,
} from '../../../../../testing/fake-data/wizard.fake';
import {asyncData} from '../../../../../testing/services/api-mock.service';

import {OpenstackProviderOptionsComponent} from './openstack-provider-options.component';

describe('OpenstackProviderOptionsComponent', () => {
  let fixture: ComponentFixture<OpenstackProviderOptionsComponent>;
  let component: OpenstackProviderOptionsComponent;
  let networksMock;
  let securityGroupsMock;
  let subnetIdsMock;
  let wizardMock;
  let providerMock;

  beforeEach(async(() => {
    wizardMock = {
      provider: jest.fn(),
      changeClusterProviderSettings: jest.fn(),
    };
    providerMock = {
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

    wizardMock.changeClusterProviderSettings.mockImplementation();
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

    networksMock = wizardMock.provider.mockReturnValue(providerMock.networks);
    providerMock.networks.mockReturnValue(asyncData(openstackNetworksFake()));

    securityGroupsMock = wizardMock.provider.mockReturnValue(providerMock);
    providerMock.securityGroups.mockReturnValue(asyncData(openstackSecurityGroupsFake()));

    subnetIdsMock = wizardMock.provider.mockReturnValue(providerMock);
    providerMock.subnets.mockReturnValue(asyncData(openstackSubnetIdsFake()));

    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule],
      declarations: [OpenstackProviderOptionsComponent],
      providers: [{provide: WizardService, useValue: wizardMock}],
    }).compileComponents();
  }));

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

  it('should set correct optional settings placeholder', () => {
    component.cluster.spec.cloud.openstack.tenant = '';
    fixture.detectChanges();
    expect(component.getSecurityGroupFormState()).toEqual('Security Group');

    component.cluster.spec.cloud.openstack.username = 'username';
    component.cluster.spec.cloud.openstack.password = 'password';
    component.cluster.spec.cloud.openstack.domain = 'domain';
    component.cluster.spec.cloud.openstack.tenant = 'tenant';
    component.securityGroups = [];
    component.networks = [];
    fixture.detectChanges();
    expect(component.getSecurityGroupFormState()).toEqual('No Security Groups available');
    expect(component.getNetworkFormState()).toEqual('No Networks available');

    component.securityGroups = openstackSecurityGroupsFake();
    component.networks = openstackSortedNetworksFake();
    fixture.detectChanges();
    expect(component.getSecurityGroupFormState()).toEqual('Security Group');
    expect(component.getNetworkFormState()).toEqual('Network');
  });

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
