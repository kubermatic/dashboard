import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '../../../../shared/shared.module';
import { fakeVSphereCluster } from '../../../../testing/fake-data/cluster.fake';
import { WizardService } from '../../../../core/services/wizard/wizard.service';
import { VSphereClusterSettingsComponent } from './vsphere.component';

describe('VSphereClusterSettingsComponent', () => {
  let fixture: ComponentFixture<VSphereClusterSettingsComponent>;
  let component: VSphereClusterSettingsComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        ReactiveFormsModule,
        SharedModule
      ],
      declarations: [
        VSphereClusterSettingsComponent
      ],
      providers: [
        WizardService
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VSphereClusterSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeVSphereCluster;
    component.cluster.spec.cloud.vsphere.username = '';
    component.cluster.spec.cloud.vsphere.password = '';
    fixture.detectChanges();
  });

  it('should create the vsphere cluster cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.vsphereSettingsForm.valid).toBeFalsy();
  });

  it('required fields', () => {
    expect(component.vsphereSettingsForm.valid).toBeFalsy('form is initially not valid');
    expect(component.vsphereSettingsForm.controls.username.valid).toBeFalsy('username field is initially not valid');
    expect(component.vsphereSettingsForm.controls.username.hasError('required')).toBeTruthy('username field has initially required error');
    expect(component.vsphereSettingsForm.controls.password.valid).toBeFalsy('password field is initially not valid');
    expect(component.vsphereSettingsForm.controls.password.hasError('required')).toBeTruthy('password field has initially required error');

    component.vsphereSettingsForm.controls.username.patchValue('foo');
    expect(component.vsphereSettingsForm.controls.username.hasError('required')).toBeFalsy('username field has no required error after setting foo');
    component.vsphereSettingsForm.controls.password.patchValue('foo');
    expect(component.vsphereSettingsForm.controls.password.hasError('required')).toBeFalsy('password field has no required error after setting foo');

  });
});
