import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ApiService, WizardService} from '../../../../core/services';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeVSphereCluster} from '../../../../testing/fake-data/cluster.fake';
import {ApiMockService} from '../../../../testing/services/api-mock.service';
import {VSphereClusterSettingsComponent} from './vsphere.component';

describe('VSphereClusterSettingsComponent', () => {
  let fixture: ComponentFixture<VSphereClusterSettingsComponent>;
  let component: VSphereClusterSettingsComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            BrowserModule,
            BrowserAnimationsModule,
            ReactiveFormsModule,
            SharedModule,
          ],
          declarations: [
            VSphereClusterSettingsComponent,
          ],
          providers: [
            {provide: ApiService, useClass: ApiMockService},
            WizardService,
          ],
        })
        .compileComponents();
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
    expect(component.form.valid).toBeFalsy();
  });

  it('required fields', () => {
    expect(component.form.valid).toBeFalsy('form is initially not valid');
    expect(component.form.controls.infraManagementUsername.valid).toBeFalsy('username field is initially not valid');
    expect(component.form.controls.infraManagementUsername.hasError('required'))
        .toBeTruthy('username field has initially required error');
    expect(component.form.controls.infraManagementPassword.valid).toBeFalsy('password field is initially not valid');
    expect(component.form.controls.infraManagementPassword.hasError('required'))
        .toBeTruthy('password field has initially required error');

    component.form.controls.infraManagementUsername.patchValue('foo');
    expect(component.form.controls.infraManagementUsername.hasError('required'))
        .toBeFalsy('username field has no required error after setting foo');
    component.form.controls.infraManagementPassword.patchValue('foo');
    expect(component.form.controls.infraManagementPassword.hasError('required'))
        .toBeFalsy('password field has no required error after setting foo');
  });
});
