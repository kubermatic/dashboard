import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClusterService } from '../../../../core/services';
import { ApiService } from '../../../../core/services/api/api.service';
import { SharedModule } from '../../../../shared/shared.module';
import { fakeOpenstackCluster } from '../../../../testing/fake-data/cluster.fake';
import { ApiMockService } from '../../../../testing/services/api-mock.service';
import { MatDialogRefMock } from '../../../../testing/services/mat-dialog-ref-mock';
import { AWSProviderSettingsComponent } from '../aws-provider-settings/aws-provider-settings.component';
import { AzureProviderSettingsComponent } from '../azure-provider-settings/azure-provider-settings.component';
import { DigitaloceanProviderSettingsComponent } from '../digitalocean-provider-settings/digitalocean-provider-settings.component';
import { EditProviderSettingsComponent } from '../edit-provider-settings.component';
import { HetznerProviderSettingsComponent } from '../hetzner-provider-settings/hetzner-provider-settings.component';
import { OpenstackProviderSettingsComponent } from '../openstack-provider-settings/openstack-provider-settings.component';
import { VSphereProviderSettingsComponent } from '../vsphere-provider-settings/vsphere-provider-settings.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
];

describe('OpenstackProviderSettingsComponent', () => {
  let fixture: ComponentFixture<OpenstackProviderSettingsComponent>;
  let component: OpenstackProviderSettingsComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
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
        { provide: ApiService, useClass: ApiMockService },
        { provide: MatDialogRef, useClass: MatDialogRefMock },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenstackProviderSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeOpenstackCluster();
    component.cluster.spec.cloud.openstack = {
      password: '',
      username: '',
      tenant: '',
      domain: '',
      network: '',
      securityGroups: '',
      floatingIpPool: '',
      subnetID: '',
    };
    fixture.detectChanges();
  });

  it('should create the openstack provider settings cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.openstackProviderSettingsForm.valid).toBeFalsy();
  });

  it('form required values', () => {
    expect(component.openstackProviderSettingsForm.valid).toBeFalsy('form is invalid with empty defaults');
    expect(component.openstackProviderSettingsForm.controls.username.hasError('required')).toBeTruthy('username field has required error');
    expect(component.openstackProviderSettingsForm.controls.password.hasError('required')).toBeTruthy('password field has required error');

    component.openstackProviderSettingsForm.controls.username.patchValue('foo');
    expect(component.openstackProviderSettingsForm.controls.username.hasError('required')).toBeFalsy('username has no required error after setting value');
    expect(component.openstackProviderSettingsForm.valid).toBeFalsy('form is still invalid after setting only username');

    component.openstackProviderSettingsForm.controls.password.patchValue('bar');
    expect(component.openstackProviderSettingsForm.controls.password.hasError('required')).toBeFalsy('password field has no required error after setting value');
    expect(component.openstackProviderSettingsForm.valid).toBeTruthy('form is valid after setting both username and password');
  });
});
