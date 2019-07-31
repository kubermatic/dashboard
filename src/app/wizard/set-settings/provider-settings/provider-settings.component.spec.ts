import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';

import {ApiService, ProjectService, UserService, WizardService} from '../../../core/services';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {RouterStub} from '../../../testing/router-stubs';
import {ActivatedRouteMock} from '../../../testing/services/activate-route-mock';
import {ApiMockService} from '../../../testing/services/api-mock.service';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';
import {CustomPresetsSettingsComponent} from '../custom-credentials/custom-presets.component';
import {ClusterSSHKeysComponent} from '../ssh-keys/cluster-ssh-keys.component';

import {AWSClusterSettingsComponent} from './aws/aws.component';
import {AzureClusterSettingsComponent} from './azure/azure.component';
import {BringyourownClusterSettingsComponent} from './bringyourown/bringyourown.component';
import {DigitaloceanClusterSettingsComponent} from './digitalocean/digitalocean.component';
import {GCPClusterSettingsComponent} from './gcp/gcp.component';
import {HetznerClusterSettingsComponent} from './hetzner/hetzner.component';
import {OpenstackClusterSettingsComponent} from './openstack/openstack.component';
import {PacketClusterSettingsComponent} from './packet/packet.component';
import {ClusterProviderSettingsComponent} from './provider-settings.component';
import {VSphereClusterSettingsComponent} from './vsphere/vsphere.component';

describe('ClusterProviderSettingsComponent', () => {
  let fixture: ComponentFixture<ClusterProviderSettingsComponent>;
  let component: ClusterProviderSettingsComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            ReactiveFormsModule,
            SharedModule,
            HttpClientModule,
          ],
          declarations: [
            CustomPresetsSettingsComponent,
            ClusterProviderSettingsComponent,
            ClusterSSHKeysComponent,
            DigitaloceanClusterSettingsComponent,
            AWSClusterSettingsComponent,
            OpenstackClusterSettingsComponent,
            BringyourownClusterSettingsComponent,
            HetznerClusterSettingsComponent,
            VSphereClusterSettingsComponent,
            AzureClusterSettingsComponent,
            PacketClusterSettingsComponent,
            GCPClusterSettingsComponent,
          ],
          providers: [
            WizardService,
            {provide: ActivatedRoute, useCass: ActivatedRouteMock},
            {provide: ApiService, useClass: ApiMockService},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: UserService, useClass: UserMockService},
            {provide: Router, useClass: RouterStub},
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterProviderSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    component.clusterSSHKeys = [];
    fixture.detectChanges();
  });

  it('should create the provider cluster cmp', () => {
    expect(component).toBeTruthy();
  });
});
