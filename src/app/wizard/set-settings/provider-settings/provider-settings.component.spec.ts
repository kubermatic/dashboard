import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ClusterProviderSettingsComponent } from './provider-settings.component';
import { WizardService } from '../../../core/services/wizard/wizard.service';
import { fakeDigitaloceanCluster } from '../../../testing/fake-data/cluster.fake';
import { DigitaloceanClusterSettingsComponent } from './digitalocean/digitalocean.component';
import { AWSClusterSettingsComponent } from './aws/aws.component';
import { OpenstackClusterSettingsComponent } from './openstack/openstack.component';
import { BringyourownClusterSettingsComponent } from './bringyourown/bringyourown.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';

describe('ClusterProviderSettingsComponent', () => {
  let fixture: ComponentFixture<ClusterProviderSettingsComponent>;
  let component: ClusterProviderSettingsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        SharedModule

      ],
      declarations: [
        ClusterProviderSettingsComponent,
        DigitaloceanClusterSettingsComponent,
        AWSClusterSettingsComponent,
        OpenstackClusterSettingsComponent,
        BringyourownClusterSettingsComponent,
      ],
      providers: [
        WizardService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterProviderSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster;
    fixture.detectChanges();
  });

  it('should create the provider cluster cmp', () => {
    expect(component).toBeTruthy();
  });
});
