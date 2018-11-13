import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ApiService, ClusterService} from '../../../../core/services';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeVSphereCluster} from '../../../../testing/fake-data/cluster.fake';
import {ApiMockService} from '../../../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../../../testing/services/mat-dialog-ref-mock';
import {AWSProviderSettingsComponent} from '../aws-provider-settings/aws-provider-settings.component';
import {AzureProviderSettingsComponent} from '../azure-provider-settings/azure-provider-settings.component';
import {DigitaloceanProviderSettingsComponent} from '../digitalocean-provider-settings/digitalocean-provider-settings.component';
import {EditProviderSettingsComponent} from '../edit-provider-settings.component';
import {HetznerProviderSettingsComponent} from '../hetzner-provider-settings/hetzner-provider-settings.component';
import {OpenstackProviderSettingsComponent} from '../openstack-provider-settings/openstack-provider-settings.component';
import {VSphereProviderSettingsComponent} from './vsphere-provider-settings.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
];

describe('VSphereProviderSettingsComponent', () => {
  let fixture: ComponentFixture<VSphereProviderSettingsComponent>;
  let component: VSphereProviderSettingsComponent;

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            EditProviderSettingsComponent,
            AWSProviderSettingsComponent,
            DigitaloceanProviderSettingsComponent,
            HetznerProviderSettingsComponent,
            OpenstackProviderSettingsComponent,
            VSphereProviderSettingsComponent,
            AzureProviderSettingsComponent,
          ],
          providers: [
            ClusterService,
            {provide: ApiService, useClass: ApiMockService},
            {provide: MatDialogRef, useClass: MatDialogRefMock},
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VSphereProviderSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeVSphereCluster();
    component.cluster.spec.cloud.vsphere = {
      username: '',
      password: '',
      vmNetName: '',
      infraManagementUser: {
        username: '',
        password: '',
      },
    };
    fixture.detectChanges();
  });

  it('should create the vsphere provider settings cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.vsphereProviderSettingsForm.valid).toBeFalsy();
  });

  it('required fields', () => {
    expect(component.vsphereProviderSettingsForm.valid).toBeFalsy('form is initially not valid');
    expect(component.vsphereProviderSettingsForm.controls.infraManagementUsername.valid)
        .toBeFalsy('username field is initially not valid');
    expect(component.vsphereProviderSettingsForm.controls.infraManagementUsername.hasError('required'))
        .toBeTruthy('username field has initially required error');
    expect(component.vsphereProviderSettingsForm.controls.infraManagementPassword.valid)
        .toBeFalsy('password field is initially not valid');
    expect(component.vsphereProviderSettingsForm.controls.infraManagementPassword.hasError('required'))
        .toBeTruthy('password field has initially required error');

    component.vsphereProviderSettingsForm.controls.infraManagementUsername.patchValue('foo');
    expect(component.vsphereProviderSettingsForm.controls.infraManagementUsername.hasError('required'))
        .toBeFalsy('username field has no required error after setting foo');
    component.vsphereProviderSettingsForm.controls.infraManagementPassword.patchValue('foo');
    expect(component.vsphereProviderSettingsForm.controls.infraManagementPassword.hasError('required'))
        .toBeFalsy('password field has no required error after setting foo');
  });
});
