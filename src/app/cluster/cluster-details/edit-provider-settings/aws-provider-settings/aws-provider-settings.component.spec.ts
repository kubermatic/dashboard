import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditProviderSettingsComponent } from '../edit-provider-settings.component';
import { AWSProviderSettingsComponent } from '../aws-provider-settings/aws-provider-settings.component';
import { DigitaloceanProviderSettingsComponent } from '../digitalocean-provider-settings/digitalocean-provider-settings.component';
import { HetznerProviderSettingsComponent } from '../hetzner-provider-settings/hetzner-provider-settings.component';
import { OpenstackProviderSettingsComponent } from '../openstack-provider-settings/openstack-provider-settings.component';
import { VSphereProviderSettingsComponent } from '../vsphere-provider-settings/vsphere-provider-settings.component';
import { MatDialogRef } from '@angular/material';
import { MatDialogRefMock } from '../../../../testing/services/mat-dialog-ref-mock';
import { SharedModule } from '../../../../shared/shared.module';
import { ApiService } from '../../../../core/services/api/api.service';
import { ClusterService } from '../../../../core/services';
import { ApiMockService } from '../../../../testing/services/api-mock.service';
import { fakeAWSCluster } from '../../../../testing/fake-data/cluster.fake';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule
];

describe('AWSProviderSettingsComponent', () => {
  let fixture: ComponentFixture<AWSProviderSettingsComponent>;
  let component: AWSProviderSettingsComponent;

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
      ],
      providers: [
        ClusterService,
        { provide: ApiService, useClass: ApiMockService },
        { provide: MatDialogRef, useClass: MatDialogRefMock }
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AWSProviderSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeAWSCluster;
    component.cluster.spec.cloud.aws = {
      accessKeyId: '',
      secretAccessKey: '',
    };
    fixture.detectChanges();
  });

  it('should create the aws provider settings cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.awsProviderSettingsForm.valid).toBeFalsy();
  });

  it('form required values', () => {
    component.awsProviderSettingsForm.reset();
    fixture.detectChanges();

    expect(component.awsProviderSettingsForm.valid).toBeFalsy('form is invalid with empty defaults');
    expect(component.awsProviderSettingsForm.controls.accessKeyId.hasError('required')).toBeTruthy('access key id field has required error');
    expect(component.awsProviderSettingsForm.controls.secretAccessKey.hasError('required')).toBeTruthy('secret access key field has required error');

    component.awsProviderSettingsForm.controls.accessKeyId.patchValue('foo');
    fixture.detectChanges();
    expect(component.awsProviderSettingsForm.controls.accessKeyId.hasError('required')).toBeFalsy('access key id has no required error after setting value');
    expect(component.awsProviderSettingsForm.valid).toBeFalsy('form is still invalid after setting only access key id');

    component.awsProviderSettingsForm.controls.secretAccessKey.patchValue('bar');
    fixture.detectChanges();
    expect(component.awsProviderSettingsForm.controls.secretAccessKey.hasError('required')).toBeFalsy('secret access key field has no required error after setting value');
    expect(component.awsProviderSettingsForm.valid).toBeTruthy('form is valid after setting both access key id and secret access key');
  });
});
