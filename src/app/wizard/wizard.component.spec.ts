import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatDialog} from '@angular/material/dialog';
import {MatTabsModule} from '@angular/material/tabs';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';

import {CoreModule} from '../core/core.module';
import {
  ApiService,
  ClusterService,
  DatacenterService,
  ProjectService,
  WizardService,
} from '../core/services';
import {NodeDataService} from '../core/services/node-data/node-data.service';
import {SettingsService} from '../core/services/settings/settings.service';
import {StepsService} from '../core/services/wizard/steps.service';
import {ClusterNameGenerator} from '../core/util/name-generator.service';
import {GoogleAnalyticsService} from '../google-analytics.service';
import {MachineNetworksModule} from '../machine-networks/machine-networks.module';
import {AlibabaNodeDataComponent} from '../node-data/alibaba-node-data/alibaba-node-data.component';
import {AlibabaNodeOptionsComponent} from '../node-data/alibaba-node-data/alibaba-node-options/alibaba-node-options.component';
import {AWSNodeDataComponent} from '../node-data/aws-node-data/aws-node-data.component';
import {AWSNodeOptionsComponent} from '../node-data/aws-node-data/aws-node-options/aws-node-options.component';
import {AzureNodeDataComponent} from '../node-data/azure-node-data/azure-node-data.component';
import {AzureNodeOptionsComponent} from '../node-data/azure-node-data/azure-node-options/azure-node-options.component';
import {DigitaloceanNodeDataComponent} from '../node-data/digitalocean-node-data/digitalocean-node-data.component';
import {DigitaloceanNodeOptionsComponent} from '../node-data/digitalocean-node-data/digitalocean-node-options/digitalocean-node-options.component';
import {GCPNodeDataComponent} from '../node-data/gcp-node-data/gcp-node-data.component';
import {GCPNodeOptionsComponent} from '../node-data/gcp-node-data/gcp-node-options/gcp-node-options.component';
import {HetznerNodeDataComponent} from '../node-data/hetzner-node-data/hetzner-node-data.component';
import {KubeVirtNodeDataComponent} from '../node-data/kubevirt-add-node/kubevirt-node-data.component';
import {NodeDataOptionsComponent} from '../node-data/node-data-options/node-data-options.component';
import {NodeDataComponent} from '../node-data/node-data.component';
import {OpenstackNodeDataComponent} from '../node-data/openstack-node-data/openstack-node-data.component';
import {OpenstackNodeOptionsComponent} from '../node-data/openstack-node-data/openstack-node-options/openstack-node-options.component';
import {PacketNodeDataComponent} from '../node-data/packet-node-data/packet-node-data.component';
import {PacketNodeOptionsComponent} from '../node-data/packet-node-data/packet-node-options/packet-node-options.component';
import {VSphereNodeDataComponent} from '../node-data/vsphere-add-node/vsphere-node-data.component';
import {VSphereNodeOptionsComponent} from '../node-data/vsphere-add-node/vsphere-node-options/vsphere-node-options.component';
import {SharedModule} from '../shared/shared.module';
import {masterVersionsFake} from '../testing/fake-data/cluster-spec.fake';
import {fakeDigitaloceanCluster} from '../testing/fake-data/cluster.fake';
import {
  ActivatedRouteStub,
  RouterStub,
  RouterTestingModule,
} from '../testing/router-stubs';
import {ApiMockService, asyncData} from '../testing/services/api-mock.service';
import {ClusterMockService} from '../testing/services/cluster-mock-service';
import {DatacenterMockService} from '../testing/services/datacenter-mock.service';
import {ProjectMockService} from '../testing/services/project-mock.service';
import {SettingsMockService} from '../testing/services/settings-mock.service';

import {ProgressComponent} from './progress/progress.component';
import {SetClusterSpecComponent} from './set-cluster-spec/set-cluster-spec.component';
import {SetDatacenterComponent} from './set-datacenter/set-datacenter.component';
import {SetMachineNetworksComponent} from './set-machine-networks/set-machine-networks.component';
import {SetProviderComponent} from './set-provider/set-provider.component';
import {CustomPresetsSettingsComponent} from './set-settings/custom-credentials/custom-presets.component';
import {ExtendedOptionsComponent} from './set-settings/extended-options/extended-options.component';
import {AlibabaClusterSettingsComponent} from './set-settings/provider-settings/alibaba/alibaba.component';
import {AWSProviderOptionsComponent} from './set-settings/provider-settings/aws/aws-provider-options/aws-provider-options.component';
import {AWSClusterSettingsComponent} from './set-settings/provider-settings/aws/aws.component';
import {AzureProviderOptionsComponent} from './set-settings/provider-settings/azure/azure-provider-options/azure-provider-options.component';
import {AzureClusterSettingsComponent} from './set-settings/provider-settings/azure/azure.component';
import {BringyourownClusterSettingsComponent} from './set-settings/provider-settings/bringyourown/bringyourown.component';
import {DigitaloceanClusterSettingsComponent} from './set-settings/provider-settings/digitalocean/digitalocean.component';
import {GCPProviderOptionsComponent} from './set-settings/provider-settings/gcp/gcp-provider-options/gcp-provider-options.component';
import {GCPClusterSettingsComponent} from './set-settings/provider-settings/gcp/gcp.component';
import {HetznerClusterSettingsComponent} from './set-settings/provider-settings/hetzner/hetzner.component';
import {KubeVirtClusterSettingsComponent} from './set-settings/provider-settings/kubevirt/kubevirt.component';
import {OpenstackProviderOptionsComponent} from './set-settings/provider-settings/openstack/openstack-provider-options/openstack-provider-options.component';
import {OpenstackClusterSettingsComponent} from './set-settings/provider-settings/openstack/openstack.component';
import {PacketClusterSettingsComponent} from './set-settings/provider-settings/packet/packet.component';
import {ClusterProviderOptionsComponent} from './set-settings/provider-settings/provider-options/provider-options.component';
import {ClusterProviderSettingsComponent} from './set-settings/provider-settings/provider-settings.component';
import {VSphereProviderOptionsComponent} from './set-settings/provider-settings/vsphere/vsphere-provider-options/vsphere-provider-options.component';
import {VSphereClusterSettingsComponent} from './set-settings/provider-settings/vsphere/vsphere.component';
import {SetSettingsComponent} from './set-settings/set-settings.component';
import {ClusterSSHKeysComponent} from './set-settings/ssh-keys/cluster-ssh-keys.component';
import {SummaryComponent} from './summary/summary.component';
import {WizardComponent} from './wizard.component';

describe('WizardComponent', () => {
  let fixture: ComponentFixture<WizardComponent>;
  let component: WizardComponent;

  beforeEach(async(() => {
    const apiMock = {
      createCluster: jest.fn(),
      getCluster: jest.fn(),
      getMasterVersions: jest.fn(),
    };
    apiMock.createCluster.mockReturnValue(asyncData(fakeDigitaloceanCluster()));
    apiMock.getCluster.mockReturnValue(asyncData(fakeDigitaloceanCluster()));
    apiMock.getMasterVersions.mockReturnValue(asyncData(masterVersionsFake()));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        RouterTestingModule,
        SharedModule,
        MatButtonToggleModule,
        MatTabsModule,
        MachineNetworksModule,
        HttpClientModule,
        CoreModule,
      ],
      declarations: [
        ExtendedOptionsComponent,
        CustomPresetsSettingsComponent,
        WizardComponent,
        ProgressComponent,
        SetSettingsComponent,
        ClusterSSHKeysComponent,
        ClusterProviderSettingsComponent,
        ClusterProviderOptionsComponent,
        DigitaloceanClusterSettingsComponent,
        AlibabaClusterSettingsComponent,
        AWSClusterSettingsComponent,
        AWSProviderOptionsComponent,
        OpenstackClusterSettingsComponent,
        OpenstackProviderOptionsComponent,
        BringyourownClusterSettingsComponent,
        GCPClusterSettingsComponent,
        GCPProviderOptionsComponent,
        HetznerClusterSettingsComponent,
        VSphereClusterSettingsComponent,
        VSphereProviderOptionsComponent,
        AzureClusterSettingsComponent,
        AzureProviderOptionsComponent,
        PacketClusterSettingsComponent,
        PacketNodeDataComponent,
        PacketNodeOptionsComponent,
        NodeDataComponent,
        NodeDataOptionsComponent,
        OpenstackNodeDataComponent,
        OpenstackNodeOptionsComponent,
        AlibabaNodeDataComponent,
        AlibabaNodeOptionsComponent,
        AWSNodeDataComponent,
        AWSNodeOptionsComponent,
        DigitaloceanNodeDataComponent,
        DigitaloceanNodeOptionsComponent,
        GCPNodeDataComponent,
        GCPNodeOptionsComponent,
        HetznerNodeDataComponent,
        VSphereNodeDataComponent,
        VSphereNodeOptionsComponent,
        AzureNodeDataComponent,
        AzureNodeOptionsComponent,
        SetClusterSpecComponent,
        SetMachineNetworksComponent,
        SetProviderComponent,
        SetDatacenterComponent,
        KubeVirtClusterSettingsComponent,
        KubeVirtNodeDataComponent,
        SummaryComponent,
      ],
      providers: [
        {provide: Router, useClass: RouterStub},
        {provide: ClusterService, useClass: ClusterMockService},
        {provide: ApiService, useClass: ApiMockService},
        {provide: DatacenterService, useClass: DatacenterMockService},
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        MatDialog,
        WizardService,
        NodeDataService,
        StepsService,
        ClusterNameGenerator,
        GoogleAnalyticsService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    fixture.debugElement.injector.get(Router);
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('initially start with step 0', () => {
    expect(component.currentStepIndex).toBe(0);
  });
});
