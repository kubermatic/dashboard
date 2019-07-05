import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatTabsModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';

import {AppConfigService} from '../../app-config.service';
import {ApiService, ClusterService, DatacenterService, ProjectService, UserService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {ClusterNameGenerator} from '../../core/util/name-generator.service';
import {AWSNodeDataComponent} from '../../node-data/aws-node-data/aws-node-data.component';
import {AzureNodeDataComponent} from '../../node-data/azure-node-data/azure-node-data.component';
import {DigitaloceanNodeDataComponent} from '../../node-data/digitalocean-node-data/digitalocean-node-data.component';
import {DigitaloceanOptionsComponent} from '../../node-data/digitalocean-node-data/digitalocean-options/digitalocean-options.component';
import {GCPNodeDataComponent} from '../../node-data/gcp-node-data/gcp-node-data.component';
import {HetznerNodeDataComponent} from '../../node-data/hetzner-node-data/hetzner-node-data.component';
import {NodeDataComponent} from '../../node-data/node-data.component';
import {OpenstackNodeDataComponent} from '../../node-data/openstack-node-data/openstack-node-data.component';
import {OpenstackOptionsComponent} from '../../node-data/openstack-node-data/openstack-options/openstack-options.component';
import {PacketNodeDataComponent} from '../../node-data/packet-node-data/packet-node-data.component';
import {VSphereNodeDataComponent} from '../../node-data/vsphere-add-node/vsphere-node-data.component';
import {VSphereOptionsComponent} from '../../node-data/vsphere-add-node/vsphere-options/vsphere-options.component';
import {SharedModule} from '../../shared/shared.module';
import {RouterStub} from '../../testing/router-stubs';
import {ActivatedRouteMock} from '../../testing/services/activate-route-mock';
import {ApiMockService} from '../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../testing/services/app-config-mock.service';
import {ClusterMockService} from '../../testing/services/cluster-mock-service';
import {DatacenterMockService} from '../../testing/services/datacenter-mock.service';
import {ClusterNameGeneratorMock} from '../../testing/services/name-generator-mock.service';
import {ProjectMockService} from '../../testing/services/project-mock.service';
import {UserMockService} from '../../testing/services/user-mock.service';
import {CustomPresetsSettingsComponent} from './custom-credentials/custom-presets.component';

import {AWSClusterSettingsComponent} from './provider-settings/aws/aws.component';
import {AzureClusterSettingsComponent} from './provider-settings/azure/azure.component';
import {BringyourownClusterSettingsComponent} from './provider-settings/bringyourown/bringyourown.component';
import {DigitaloceanClusterSettingsComponent} from './provider-settings/digitalocean/digitalocean.component';
import {GCPClusterSettingsComponent} from './provider-settings/gcp/gcp.component';
import {HetznerClusterSettingsComponent} from './provider-settings/hetzner/hetzner.component';
import {OpenstackClusterSettingsComponent} from './provider-settings/openstack/openstack.component';
import {PacketClusterSettingsComponent} from './provider-settings/packet/packet.component';
import {ClusterProviderSettingsComponent} from './provider-settings/provider-settings.component';
import {VSphereClusterSettingsComponent} from './provider-settings/vsphere/vsphere.component';
import {SetSettingsComponent} from './set-settings.component';
import {ClusterSSHKeysComponent} from './ssh-keys/cluster-ssh-keys.component';

describe('SetSettingsComponent', () => {
  let fixture: ComponentFixture<SetSettingsComponent>;
  let component: SetSettingsComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            SharedModule,
            MatTabsModule,
            HttpClientModule,
          ],
          declarations: [
            CustomPresetsSettingsComponent,
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
            PacketClusterSettingsComponent,
            GCPClusterSettingsComponent,
            NodeDataComponent,
            OpenstackNodeDataComponent,
            OpenstackOptionsComponent,
            AWSNodeDataComponent,
            DigitaloceanNodeDataComponent,
            DigitaloceanOptionsComponent,
            HetznerNodeDataComponent,
            VSphereNodeDataComponent,
            VSphereOptionsComponent,
            AzureNodeDataComponent,
            PacketNodeDataComponent,
            GCPNodeDataComponent,
          ],
          providers: [
            NodeDataService,
            WizardService,
            {provide: ActivatedRoute, useCass: ActivatedRouteMock},
            {provide: ApiService, useClass: ApiMockService},
            {provide: ClusterService, useClass: ClusterMockService},
            {provide: DatacenterService, useValue: DatacenterMockService},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: UserService, useClass: UserMockService},
            {provide: DatacenterService, useClass: DatacenterMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            {provide: Router, useClass: RouterStub},
            {provide: ClusterNameGenerator, useClass: ClusterNameGeneratorMock},
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create the set-settings cmp', () => {
    expect(component).toBeTruthy();
  });
});
