import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { OpenstackClusterSettingsComponent } from './openstack.component';
import { SharedModule } from '../../../../shared/shared.module';
import { WizardService } from '../../../../core/services/wizard/wizard.service';
import { fakeOpenstackCluster } from '../../../../testing/fake-data/cluster.fake';

describe('OpenstackClusterSettingsComponent', () => {
  let fixture: ComponentFixture<OpenstackClusterSettingsComponent>;
  let component: OpenstackClusterSettingsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        SharedModule
      ],
      declarations: [
        OpenstackClusterSettingsComponent
      ],
      providers: [
        WizardService
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenstackClusterSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeOpenstackCluster;
    component.cluster.spec.cloud.openstack = {
      tenant: '',
      domain: '',
      network: '',
      securityGroups: '',
      floatingIpPool: '',
      password: '',
      username: '',
    };
    fixture.detectChanges();
  });

  it('should create the openstack cluster cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.openstackSettingsForm.valid).toBeFalsy();
  });
});
