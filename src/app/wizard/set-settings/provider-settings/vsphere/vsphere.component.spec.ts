import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedModule } from '../../../../shared/shared.module';
import { fakeVSphereCluster } from '../../../../testing/fake-data/cluster.fake';
import { ApiMockService } from '../../../../testing/services/api-mock.service';
import { WizardService, ApiService } from '../../../../core/services';
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
        { provide: ApiService, useClass: ApiMockService },
        WizardService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VSphereClusterSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeVSphereCluster();
    component.cluster.spec.cloud.vsphere.username = '';
    component.cluster.spec.cloud.vsphere.password = '';
    component.cluster.spec.cloud.vsphere.infraManagementUser.username = '';
    component.cluster.spec.cloud.vsphere.infraManagementUser.password = '';
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
    expect(component.vsphereSettingsForm.controls.infraManagementUsername.valid).toBeFalsy('username field is initially not valid');
    expect(component.vsphereSettingsForm.controls.infraManagementUsername.hasError('required')).toBeTruthy('username field has initially required error');
    expect(component.vsphereSettingsForm.controls.infraManagementPassword.valid).toBeFalsy('password field is initially not valid');
    expect(component.vsphereSettingsForm.controls.infraManagementPassword.hasError('required')).toBeTruthy('password field has initially required error');

    component.vsphereSettingsForm.controls.infraManagementUsername.patchValue('foo');
    expect(component.vsphereSettingsForm.controls.infraManagementUsername.hasError('required')).toBeFalsy('username field has no required error after setting foo');
    component.vsphereSettingsForm.controls.infraManagementPassword.patchValue('foo');
    expect(component.vsphereSettingsForm.controls.infraManagementPassword.hasError('required')).toBeFalsy('password field has no required error after setting foo');

  });
});
