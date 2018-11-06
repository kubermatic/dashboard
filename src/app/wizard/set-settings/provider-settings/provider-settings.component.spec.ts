import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WizardService } from '../../../core/services/wizard/wizard.service';
import { SharedModule } from '../../../shared/shared.module';
import { fakeDigitaloceanCluster } from '../../../testing/fake-data/cluster.fake';
import { AWSClusterSettingsComponent } from './aws/aws.component';
import { AzureClusterSettingsComponent } from './azure/azure.component';
import { BringyourownClusterSettingsComponent } from './bringyourown/bringyourown.component';
import { DigitaloceanClusterSettingsComponent } from './digitalocean/digitalocean.component';
import { HetznerClusterSettingsComponent } from './hetzner/hetzner.component';
import { OpenstackClusterSettingsComponent } from './openstack/openstack.component';
import { ClusterProviderSettingsComponent } from './provider-settings.component';
import { VSphereClusterSettingsComponent } from './vsphere/vsphere.component';

describe('ClusterProviderSettingsComponent', () => {
  let fixture: ComponentFixture<ClusterProviderSettingsComponent>;
  let component: ClusterProviderSettingsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        SharedModule,
      ],
      declarations: [
        ClusterProviderSettingsComponent,
        DigitaloceanClusterSettingsComponent,
        AWSClusterSettingsComponent,
        OpenstackClusterSettingsComponent,
        BringyourownClusterSettingsComponent,
        HetznerClusterSettingsComponent,
        VSphereClusterSettingsComponent,
        AzureClusterSettingsComponent,
      ],
      providers: [
        WizardService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterProviderSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    fixture.detectChanges();
  });

  it('should create the provider cluster cmp', () => {
    expect(component).toBeTruthy();
  });
});
