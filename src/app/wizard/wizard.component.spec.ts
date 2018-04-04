import { ApiService, DatacenterService, InitialNodeDataService } from '../core/services';
import { WizardComponent } from './wizard.component';
import { Router } from '@angular/router';
import { SharedModule } from '..//shared/shared.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '../testing/router-stubs';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterStub } from './../testing/router-stubs';
import { asyncData } from '../testing/services/api-mock.service';
import { MatButtonToggleModule, MatDialog } from '@angular/material';
import { DatacenterMockService } from '../testing/services/datacenter-mock.service';
import { fakeDigitaloceanCluster } from '../testing/fake-data/cluster.fake';
import { ProgressComponent } from './progress/progress.component';
import { SetSettingsComponent } from './set-settings/set-settings.component';
import { AddNodeComponent } from '../add-node/add-node.component';
import { DigitaloceanClusterSettingsComponent } from './set-settings/provider-settings/digitalocean/digitalocean.component';
import { OpenstackAddNodeComponent } from '../add-node/openstack-add-node/openstack-add-node.component';
import { ClusterSSHKeysComponent } from './set-settings/ssh-keys/cluster-ssh-keys.component';
import { ClusterProviderSettingsComponent } from './set-settings/provider-settings/provider-settings.component';
import { DigitaloceanAddNodeComponent } from '../add-node/digitalocean-add-node/digitalocean-add-node.component';
import { BringyourownClusterSettingsComponent } from './set-settings/provider-settings/bringyourown/bringyourown.component';
import { AWSClusterSettingsComponent } from './set-settings/provider-settings/aws/aws.component';
import { AwsAddNodeComponent } from '../add-node/aws-add-node/aws-add-node.component';
import { OpenstackClusterSettingsComponent } from './set-settings/provider-settings/openstack/openstack.component';
import { SetClusterNameComponent } from './set-cluster-name/set-cluster-name.component';
import { SetProviderComponent } from './set-provider/set-provider.component';
import { SetDatacenterComponent } from './set-datacenter/set-datacenter.component';
import { SummaryComponent } from './summary/summary.component';
import { WizardService } from '../core/services/wizard/wizard.service';
import { AddNodeService } from '../core/services/add-node/add-node.service';
import { StepsService } from '../core/services/wizard/steps.service';
import { ClusterNameGenerator } from '../core/util/name-generator.service';
import Spy = jasmine.Spy;
import { HetznerClusterSettingsComponent } from './set-settings/provider-settings/hetzner/hetzner.component';
import { VSphereClusterSettingsComponent } from './set-settings/provider-settings/vsphere/vsphere.component';
import { HetznerAddNodeComponent } from '../add-node/hetzner-add-node/hetzner-add-node.component';

describe('WizardComponent', () => {
  let fixture: ComponentFixture<WizardComponent>;
  let component: WizardComponent;
  let router: Router;
  let createClusterSpy: Spy;
  let getClusterSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['createCluster', 'getCluster']);
    createClusterSpy = apiMock.createCluster.and.returnValue(asyncData(fakeDigitaloceanCluster));
    getClusterSpy = apiMock.getCluster.and.returnValue(asyncData(fakeDigitaloceanCluster));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SlimLoadingBarModule.forRoot(),
        RouterTestingModule,
        SharedModule,
        MatButtonToggleModule,
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
        AddNodeComponent,
        OpenstackAddNodeComponent,
        AwsAddNodeComponent,
        DigitaloceanAddNodeComponent,
        HetznerAddNodeComponent,
        SetClusterNameComponent,
        SetProviderComponent,
        SetDatacenterComponent,
        SummaryComponent,
      ],
      providers: [
        { provide: Router, useClass: RouterStub },
        { provide: ApiService, useValue: apiMock },
        { provide: DatacenterService, useClass: DatacenterMockService },
        MatDialog,
        InitialNodeDataService,
        WizardService,
        AddNodeService,
        StepsService,
        ClusterNameGenerator,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    router = fixture.debugElement.injector.get(Router);
  });

  it('should create wizard cmp', () => {
    expect(component).toBeTruthy();
  });

  it('initially start with step 0', () => {
    expect(component.currentStepIndex).toBe(0, 'initially start with step 0');
  });
});
