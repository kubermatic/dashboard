import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SetSettingsComponent } from './set-settings.component';
import { WizardService } from '../../core/services/wizard/wizard.service';
import { fakeDigitaloceanCluster } from '../../testing/fake-data/cluster.fake';
import { ClusterProviderSettingsComponent } from './provider-settings/provider-settings.component';
import { AddNodeComponent } from '../../add-node/add-node.component';
import { ClusterSSHKeysComponent } from './ssh-keys/cluster-ssh-keys.component';
import { DigitaloceanClusterSettingsComponent } from './provider-settings/digitalocean/digitalocean.component';
import { BringyourownClusterSettingsComponent } from './provider-settings/bringyourown/bringyourown.component';
import { AWSClusterSettingsComponent } from './provider-settings/aws/aws.component';
import { OpenstackClusterSettingsComponent } from './provider-settings/openstack/openstack.component';
import { OpenstackAddNodeComponent } from '../../add-node/openstack-add-node/openstack-add-node.component';
import { DigitaloceanAddNodeComponent } from '../../add-node/digitalocean-add-node/digitalocean-add-node.component';
import { AwsAddNodeComponent } from '../../add-node/aws-add-node/aws-add-node.component';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { fakeDigitaloceanSizes } from '../../testing/fake-data/addNodeModal.fake';
import { asyncData } from '../../testing/services/api-mock.service';
import { ApiService } from '../../core/services';
import { fakeSSHKeys } from '../../testing/fake-data/sshkey.fake';
import { HetznerClusterSettingsComponent } from './provider-settings/hetzner/hetzner.component';
import { VSphereClusterSettingsComponent } from './provider-settings/vsphere/vsphere.component';
import Spy = jasmine.Spy;

describe('SetSettingsComponent', () => {
  let fixture: ComponentFixture<SetSettingsComponent>;
  let component: SetSettingsComponent;
  let getDigitaloceanSizesSpy: Spy;
  let getSSHKeysSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getDigitaloceanSizes', 'getSSHKeys']);
    getDigitaloceanSizesSpy = apiMock.getDigitaloceanSizes.and.returnValue(asyncData(fakeDigitaloceanSizes));
    getSSHKeysSpy = apiMock.getSSHKeys.and.returnValue(asyncData(fakeSSHKeys));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SharedModule,
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
        AddNodeComponent,
        OpenstackAddNodeComponent,
        AwsAddNodeComponent,
        DigitaloceanAddNodeComponent,
      ],
      providers: [
        AddNodeService,
        WizardService,
        {provide: ApiService, useValue: apiMock},
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster;
    component.clusterSSHKeys = [];
    fixture.detectChanges();
  });

  it('should create the set-settings cmp', () => {
    expect(component).toBeTruthy();
  });
});
