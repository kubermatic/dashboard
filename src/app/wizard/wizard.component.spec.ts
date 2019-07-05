import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonToggleModule, MatDialog, MatTabsModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {AppConfigService} from '../app-config.service';
import {ApiService, ClusterService, DatacenterService, ProjectService, WizardService} from '../core/services';
import {NodeDataService} from '../core/services/node-data/node-data.service';
import {StepsService} from '../core/services/wizard/steps.service';
import {ClusterNameGenerator} from '../core/util/name-generator.service';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {MachineNetworksModule} from '../machine-networks/machine-networks.module';
import {AWSNodeDataComponent} from '../node-data/aws-node-data/aws-node-data.component';
import {AzureNodeDataComponent} from '../node-data/azure-node-data/azure-node-data.component';
import {DigitaloceanNodeDataComponent} from '../node-data/digitalocean-node-data/digitalocean-node-data.component';
import {DigitaloceanOptionsComponent} from '../node-data/digitalocean-node-data/digitalocean-options/digitalocean-options.component';
import {GCPNodeDataComponent} from '../node-data/gcp-node-data/gcp-node-data.component';
import {HetznerNodeDataComponent} from '../node-data/hetzner-node-data/hetzner-node-data.component';
import {NodeDataComponent} from '../node-data/node-data.component';
import {OpenstackNodeDataComponent} from '../node-data/openstack-node-data/openstack-node-data.component';
import {OpenstackOptionsComponent} from '../node-data/openstack-node-data/openstack-options/openstack-options.component';
import {PacketNodeDataComponent} from '../node-data/packet-node-data/packet-node-data.component';
import {VSphereNodeDataComponent} from '../node-data/vsphere-add-node/vsphere-node-data.component';
import {VSphereOptionsComponent} from '../node-data/vsphere-add-node/vsphere-options/vsphere-options.component';
import {SharedModule} from '../shared/shared.module';
import {masterVersionsFake} from '../testing/fake-data/cluster-spec.fake';
import {fakeDigitaloceanCluster} from '../testing/fake-data/cluster.fake';
import {ActivatedRouteStub, RouterStub, RouterTestingModule} from '../testing/router-stubs';
import {ApiMockService, asyncData} from '../testing/services/api-mock.service';
import {AppConfigMockService} from '../testing/services/app-config-mock.service';
import {ClusterMockService} from '../testing/services/cluster-mock-service';
import {DatacenterMockService} from '../testing/services/datacenter-mock.service';
import {ProjectMockService} from '../testing/services/project-mock.service';

import {ProgressComponent} from './progress/progress.component';
import {SetClusterSpecComponent} from './set-cluster-spec/set-cluster-spec.component';
import {SetDatacenterComponent} from './set-datacenter/set-datacenter.component';
import {SetMachineNetworksComponent} from './set-machine-networks/set-machine-networks.component';
import {SetProviderComponent} from './set-provider/set-provider.component';
import {CustomPresetsSettingsComponent} from './set-settings/custom-credentials/custom-presets.component';
import {AWSClusterSettingsComponent} from './set-settings/provider-settings/aws/aws.component';
import {AzureClusterSettingsComponent} from './set-settings/provider-settings/azure/azure.component';
import {BringyourownClusterSettingsComponent} from './set-settings/provider-settings/bringyourown/bringyourown.component';
import {DigitaloceanClusterSettingsComponent} from './set-settings/provider-settings/digitalocean/digitalocean.component';
import {GCPClusterSettingsComponent} from './set-settings/provider-settings/gcp/gcp.component';
import {HetznerClusterSettingsComponent} from './set-settings/provider-settings/hetzner/hetzner.component';
import {OpenstackClusterSettingsComponent} from './set-settings/provider-settings/openstack/openstack.component';
import {PacketClusterSettingsComponent} from './set-settings/provider-settings/packet/packet.component';
import {ClusterProviderSettingsComponent} from './set-settings/provider-settings/provider-settings.component';
import {VSphereClusterSettingsComponent} from './set-settings/provider-settings/vsphere/vsphere.component';
import {SetSettingsComponent} from './set-settings/set-settings.component';
import {ClusterSSHKeysComponent} from './set-settings/ssh-keys/cluster-ssh-keys.component';
import {SummaryComponent} from './summary/summary.component';
import {WizardComponent} from './wizard.component';

describe('WizardComponent', () => {
  let fixture: ComponentFixture<WizardComponent>;
  let component: WizardComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['createCluster', 'getCluster', 'getMasterVersions']);
    apiMock.createCluster.and.returnValue(asyncData(fakeDigitaloceanCluster()));
    apiMock.getCluster.and.returnValue(asyncData(fakeDigitaloceanCluster()));
    apiMock.getMasterVersions.and.returnValue(asyncData(masterVersionsFake()));

    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            SlimLoadingBarModule.forRoot(),
            RouterTestingModule,
            SharedModule,
            MatButtonToggleModule,
            MatTabsModule,
            MachineNetworksModule,
            HttpClientModule,
          ],
          declarations: [
            CustomPresetsSettingsComponent,
            WizardComponent,
            ProgressComponent,
            SetSettingsComponent,
            ClusterSSHKeysComponent,
            ClusterProviderSettingsComponent,
            DigitaloceanClusterSettingsComponent,
            AWSClusterSettingsComponent,
            OpenstackClusterSettingsComponent,
            BringyourownClusterSettingsComponent,
            GCPClusterSettingsComponent,
            HetznerClusterSettingsComponent,
            VSphereClusterSettingsComponent,
            AzureClusterSettingsComponent,
            PacketNodeDataComponent,
            PacketClusterSettingsComponent,
            NodeDataComponent,
            OpenstackNodeDataComponent,
            OpenstackOptionsComponent,
            AWSNodeDataComponent,
            DigitaloceanNodeDataComponent,
            DigitaloceanOptionsComponent,
            GCPNodeDataComponent,
            HetznerNodeDataComponent,
            VSphereNodeDataComponent,
            VSphereOptionsComponent,
            AzureNodeDataComponent,
            SetClusterSpecComponent,
            SetMachineNetworksComponent,
            SetProviderComponent,
            SetDatacenterComponent,
            SummaryComponent,
          ],
          providers: [
            {provide: Router, useClass: RouterStub},
            {provide: ClusterService, useClass: ClusterMockService},
            {provide: ApiService, useClass: ApiMockService},
            {provide: DatacenterService, useClass: DatacenterMockService},
            {provide: ActivatedRoute, useClass: ActivatedRouteStub},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            MatDialog,
            WizardService,
            NodeDataService,
            StepsService,
            ClusterNameGenerator,
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should create wizard cmp', () => {
    expect(component).toBeTruthy();
  });

  it('initially start with step 0', () => {
    expect(component.currentStepIndex).toBe(0, 'initially start with step 0');
  });
});
