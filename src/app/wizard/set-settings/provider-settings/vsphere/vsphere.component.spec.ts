import {HttpClientModule} from '@angular/common/http';
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
            HttpClientModule,
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
    expect(component.form.valid).toBeFalsy();
    expect(component.form.controls.infraManagementUsername.valid).toBeFalsy();
    expect(component.form.controls.infraManagementUsername.hasError('required')).toBeTruthy();
    expect(component.form.controls.infraManagementPassword.valid).toBeFalsy();
    expect(component.form.controls.infraManagementPassword.hasError('required')).toBeTruthy();

    component.form.controls.infraManagementUsername.patchValue('foo');
    expect(component.form.controls.infraManagementUsername.hasError('required')).toBeFalsy();
    component.form.controls.infraManagementPassword.patchValue('foo');
    expect(component.form.controls.infraManagementPassword.hasError('required')).toBeFalsy();
  });
});
