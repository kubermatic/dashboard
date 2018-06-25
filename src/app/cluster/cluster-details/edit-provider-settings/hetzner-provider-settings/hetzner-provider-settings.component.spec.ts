import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditProviderSettingsComponent } from '../edit-provider-settings.component';
import { AWSProviderSettingsComponent } from '../aws-provider-settings/aws-provider-settings.component';
import { DigitaloceanProviderSettingsComponent } from '../digitalocean-provider-settings/digitalocean-provider-settings.component';
import { HetznerProviderSettingsComponent } from '../hetzner-provider-settings/hetzner-provider-settings.component';
import { OpenstackProviderSettingsComponent } from '../openstack-provider-settings/openstack-provider-settings.component';
import { VSphereProviderSettingsComponent } from '../vsphere-provider-settings/vsphere-provider-settings.component';
import { AzureProviderSettingsComponent } from '../azure-provider-settings/azure-provider-settings.component';
import { MatDialogRef } from '@angular/material';
import { MatDialogRefMock } from '../../../../testing/services/mat-dialog-ref-mock';
import { SharedModule } from '../../../../shared/shared.module';
import { ApiService } from '../../../../core/services/api/api.service';
import { ClusterService } from '../../../../core/services';
import { ApiMockService } from '../../../../testing/services/api-mock.service';
import { fakeHetznerCluster } from '../../../../testing/fake-data/cluster.fake';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule
];

describe('HetznerProviderSettingsComponent', () => {
  let fixture: ComponentFixture<HetznerProviderSettingsComponent>;
  let component: HetznerProviderSettingsComponent;

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
        { provide: MatDialogRef, useClass: MatDialogRefMock }
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HetznerProviderSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeHetznerCluster;
    component.cluster.spec.cloud.hetzner.token = '';
    fixture.detectChanges();
  });

  it('should create the hetzner provider settings cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.hetznerProviderSettingsForm.valid).toBeFalsy();
  });

  it('token field validity', () => {
    expect(component.hetznerProviderSettingsForm.valid).toBeFalsy('form is initially not valid');
    expect(component.hetznerProviderSettingsForm.controls.token.valid).toBeFalsy('token field is initially not valid');
    expect(component.hetznerProviderSettingsForm.controls.token.hasError('required')).toBeTruthy('token field has initially required error');

    component.hetznerProviderSettingsForm.controls.token.patchValue('foo');
    expect(component.hetznerProviderSettingsForm.controls.token.hasError('required')).toBeFalsy('token field has no required error after setting foo');
    expect(component.hetznerProviderSettingsForm.controls.token.hasError('minlength')).toBeTruthy('token field has min length error after setting foo');

    component.hetznerProviderSettingsForm.controls.token.patchValue('1234567890123456789012345678901234567890123456789012345678901234567890');
    expect(component.hetznerProviderSettingsForm.controls.token.hasError('required')).toBeFalsy('token field has no required error after setting 70 chars');
    expect(component.hetznerProviderSettingsForm.controls.token.hasError('minlength')).toBeFalsy('token field has no min length error after setting 70 chars');
    expect(component.hetznerProviderSettingsForm.controls.token.hasError('maxlength')).toBeTruthy('token field has max length error after setting 70 chars');

    component.hetznerProviderSettingsForm.controls.token.patchValue('vhn92zesby42uw9f31wzn1e01ia4tso5tq2x52xyihidhma62yonrp4ebu9nlc6p');
    expect(component.hetznerProviderSettingsForm.controls.token.hasError('required')).toBeFalsy('token field has no required error after setting valid token');
    expect(component.hetznerProviderSettingsForm.controls.token.hasError('minlength')).toBeFalsy('token field has no min length error after setting valid token');
    expect(component.hetznerProviderSettingsForm.controls.token.hasError('maxlength')).toBeFalsy('token field has no max length error after setting valid token');
  });
});
