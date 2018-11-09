import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonToggleModule, MatDialog, MatTabsModule } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { AddNodeComponent } from '../add-node/add-node.component';
import { AwsAddNodeComponent } from '../add-node/aws-add-node/aws-add-node.component';
import { AzureAddNodeComponent } from '../add-node/azure-add-node/azure-add-node.component';
import { DigitaloceanAddNodeComponent } from '../add-node/digitalocean-add-node/digitalocean-add-node.component';
import { DigitaloceanOptionsComponent } from '../add-node/digitalocean-add-node/digitalocean-options/digitalocean-options.component';
import { HetznerAddNodeComponent } from '../add-node/hetzner-add-node/hetzner-add-node.component';
import { OpenstackAddNodeComponent } from '../add-node/openstack-add-node/openstack-add-node.component';
import { OpenstackOptionsComponent } from '../add-node/openstack-add-node/openstack-options/openstack-options.component';
import { VSphereAddNodeComponent } from '../add-node/vsphere-add-node/vsphere-add-node.component';
import { VSphereOptionsComponent } from '../add-node/vsphere-add-node/vsphere-options/vsphere-options.component';
import { ApiService, DatacenterService, HealthService, InitialNodeDataService, ProjectService } from '../core/services';
import { AddNodeService } from '../core/services/add-node/add-node.service';
import { StepsService } from '../core/services/wizard/steps.service';
import { WizardService } from '../core/services/wizard/wizard.service';
import { ClusterNameGenerator } from '../core/util/name-generator.service';
import { GoogleAnalyticsService } from '../google-analytics.service';
import { MachineNetworksModule } from '../machine-networks/machine-networks.module';
import { SharedModule } from '../shared/shared.module';
import { masterVersionsFake } from '../testing/fake-data/cluster-spec.fake';
import { fakeDigitaloceanCluster } from '../testing/fake-data/cluster.fake';
import { ActivatedRouteStub, RouterStub, RouterTestingModule } from '../testing/router-stubs';
import { asyncData } from '../testing/services/api-mock.service';
import { DatacenterMockService } from '../testing/services/datacenter-mock.service';
import { HealthMockService } from '../testing/services/health-mock.service';
import { ProjectMockService } from '../testing/services/project-mock.service';
import { ProgressComponent } from './progress/progress.component';
import { SetClusterSpecComponent } from './set-cluster-spec/set-cluster-spec.component';
import { SetDatacenterComponent } from './set-datacenter/set-datacenter.component';
import { SetMachineNetworksComponent } from './set-machine-networks/set-machine-networks.component';
import { SetProviderComponent } from './set-provider/set-provider.component';
import { AWSClusterSettingsComponent } from './set-settings/provider-settings/aws/aws.component';
import { AzureClusterSettingsComponent } from './set-settings/provider-settings/azure/azure.component';
import { BringyourownClusterSettingsComponent } from './set-settings/provider-settings/bringyourown/bringyourown.component';
import { DigitaloceanClusterSettingsComponent } from './set-settings/provider-settings/digitalocean/digitalocean.component';
import { HetznerClusterSettingsComponent } from './set-settings/provider-settings/hetzner/hetzner.component';
import { OpenstackClusterSettingsComponent } from './set-settings/provider-settings/openstack/openstack.component';
import { ClusterProviderSettingsComponent } from './set-settings/provider-settings/provider-settings.component';
import { VSphereClusterSettingsComponent } from './set-settings/provider-settings/vsphere/vsphere.component';
import { SetSettingsComponent } from './set-settings/set-settings.component';
import { ClusterSSHKeysComponent } from './set-settings/ssh-keys/cluster-ssh-keys.component';
import { SummaryComponent } from './summary/summary.component';
import { WizardComponent } from './wizard.component';

describe('WizardComponent', () => {
  let fixture: ComponentFixture<WizardComponent>;
  let component: WizardComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['createCluster', 'getCluster', 'getMasterVersions']);
    apiMock.createCluster.and.returnValue(asyncData(fakeDigitaloceanCluster()));
    apiMock.getCluster.and.returnValue(asyncData(fakeDigitaloceanCluster()));
    apiMock.getMasterVersions.and.returnValue(asyncData(masterVersionsFake()));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SlimLoadingBarModule.forRoot(),
        RouterTestingModule,
        SharedModule,
        MatButtonToggleModule,
        MatTabsModule,
        MachineNetworksModule,
      ],
      declarations: [
        WizardComponent,
        ProgressComponent,
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
        SetClusterSpecComponent,
        SetMachineNetworksComponent,
        SetProviderComponent,
        SetDatacenterComponent,
        SummaryComponent,
      ],
      providers: [
        { provide: Router, useClass: RouterStub },
        { provide: ApiService, useValue: apiMock },
        { provide: DatacenterService, useClass: DatacenterMockService },
        { provide: ActivatedRoute, useClass: ActivatedRouteStub },
        { provide: HealthService, useClass: HealthMockService },
        { provide: ProjectService, useClass: ProjectMockService },
        MatDialog,
        InitialNodeDataService,
        WizardService,
        AddNodeService,
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

  it('should create wizard cmp', () => {
    expect(component).toBeTruthy();
  });

  it('initially start with step 0', () => {
    expect(component.currentStepIndex).toBe(0, 'initially start with step 0');
  });
});
