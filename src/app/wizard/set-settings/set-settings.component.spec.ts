import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatTabsModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AddNodeComponent } from '../../add-node/add-node.component';
import { AwsAddNodeComponent } from '../../add-node/aws-add-node/aws-add-node.component';
import { AzureAddNodeComponent } from '../../add-node/azure-add-node/azure-add-node.component';
import { DigitaloceanAddNodeComponent } from '../../add-node/digitalocean-add-node/digitalocean-add-node.component';
import { DigitaloceanOptionsComponent } from '../../add-node/digitalocean-add-node/digitalocean-options/digitalocean-options.component';
import { HetznerAddNodeComponent } from '../../add-node/hetzner-add-node/hetzner-add-node.component';
import { OpenstackAddNodeComponent } from '../../add-node/openstack-add-node/openstack-add-node.component';
import { OpenstackOptionsComponent } from '../../add-node/openstack-add-node/openstack-options/openstack-options.component';
import { VSphereAddNodeComponent } from '../../add-node/vsphere-add-node/vsphere-add-node.component';
import { VSphereOptionsComponent } from '../../add-node/vsphere-add-node/vsphere-options/vsphere-options.component';
import { AWSClusterSettingsComponent } from './provider-settings/aws/aws.component';
import { AzureClusterSettingsComponent } from './provider-settings/azure/azure.component';
import { BringyourownClusterSettingsComponent } from './provider-settings/bringyourown/bringyourown.component';
import { DigitaloceanClusterSettingsComponent } from './provider-settings/digitalocean/digitalocean.component';
import { HetznerClusterSettingsComponent } from './provider-settings/hetzner/hetzner.component';
import { OpenstackClusterSettingsComponent } from './provider-settings/openstack/openstack.component';
import { ClusterProviderSettingsComponent } from './provider-settings/provider-settings.component';
import { VSphereClusterSettingsComponent } from './provider-settings/vsphere/vsphere.component';
import { SetSettingsComponent } from './set-settings.component';
import { ClusterSSHKeysComponent } from './ssh-keys/cluster-ssh-keys.component';

import { AppConfigService } from '../../app-config.service';
import { ApiService, DatacenterService, ProjectService, UserService, WizardService } from '../../core/services';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { SharedModule } from '../../shared/shared.module';

import { asyncData } from '../../testing/services/api-mock.service';
import { AppConfigMockService } from '../../testing/services/app-config-mock.service';
import { ProjectMockService } from '../../testing/services/project-mock.service';
import { UserMockService } from '../../testing/services/user-mock.service';

import { fakeDigitaloceanSizes } from '../../testing/fake-data/addNodeModal.fake';
import { fakeDigitaloceanCluster } from '../../testing/fake-data/cluster.fake';
import { nodeDataFake } from '../../testing/fake-data/node.fake';
import { fakeSSHKeys } from '../../testing/fake-data/sshkey.fake';
import { DatacenterMockService } from '../../testing/services/datacenter-mock.service';

describe('SetSettingsComponent', () => {
  let fixture: ComponentFixture<SetSettingsComponent>;
  let component: SetSettingsComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getDigitaloceanSizes', 'getDigitaloceanSizesForWizard', 'getSSHKeys']);
    apiMock.getDigitaloceanSizes.and.returnValue(asyncData(fakeDigitaloceanSizes()));
    apiMock.getDigitaloceanSizesForWizard.and.returnValue(asyncData(fakeDigitaloceanSizes()));
    apiMock.getSSHKeys.and.returnValue(asyncData(fakeSSHKeys()));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SharedModule,
        MatTabsModule,
      ],
      declarations: [
        SetSettingsComponent,
        ClusterSSHKeysComponent,
        ClusterProviderSettingsComponent,
        DigitaloceanClusterSettingsComponent,
        AWSClusterSettingsComponent,
        OpenstackClusterSettingsComponent,
        BringyourownClusterSettingsComponent,
        HetznerClusterSettingsComponent,
        VSphereClusterSettingsComponent,
        AzureClusterSettingsComponent,
        AddNodeComponent,
        OpenstackAddNodeComponent,
        OpenstackOptionsComponent,
        AwsAddNodeComponent,
        DigitaloceanAddNodeComponent,
        DigitaloceanOptionsComponent,
        HetznerAddNodeComponent,
        VSphereAddNodeComponent,
        VSphereOptionsComponent,
        AzureAddNodeComponent,
      ],
      providers: [
        AddNodeService,
        WizardService,
        { provide: ApiService, useValue: apiMock },
        { provide: DatacenterService, useValue: DatacenterMockService },
        { provide: ProjectService, useClass: ProjectMockService },
        { provide: UserService, useClass: UserMockService },
        { provide: DatacenterService, useClass: DatacenterMockService },
        { provide: AppConfigService, useClass: AppConfigMockService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    component.clusterSSHKeys = [];
    component.nodeData = nodeDataFake();
    fixture.detectChanges();
  });

  it('should create the set-settings cmp', () => {
    expect(component).toBeTruthy();
  });
});
