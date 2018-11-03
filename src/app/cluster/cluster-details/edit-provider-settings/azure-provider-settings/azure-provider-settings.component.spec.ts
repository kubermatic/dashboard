import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApiService, ClusterService } from '../../../../core/services';
import { SharedModule } from '../../../../shared/shared.module';
import { fakeAzureCluster } from '../../../../testing/fake-data/cluster.fake';
import { ApiMockService } from '../../../../testing/services/api-mock.service';
import { MatDialogRefMock } from '../../../../testing/services/mat-dialog-ref-mock';
import { AWSProviderSettingsComponent } from '../aws-provider-settings/aws-provider-settings.component';
import { DigitaloceanProviderSettingsComponent } from '../digitalocean-provider-settings/digitalocean-provider-settings.component';
import { EditProviderSettingsComponent } from '../edit-provider-settings.component';
import { HetznerProviderSettingsComponent } from '../hetzner-provider-settings/hetzner-provider-settings.component';
import { OpenstackProviderSettingsComponent } from '../openstack-provider-settings/openstack-provider-settings.component';
import { VSphereProviderSettingsComponent } from '../vsphere-provider-settings/vsphere-provider-settings.component';
import { AzureProviderSettingsComponent } from './azure-provider-settings.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
];

describe('AzureProviderSettingsComponent', () => {
  let fixture: ComponentFixture<AzureProviderSettingsComponent>;
  let component: AzureProviderSettingsComponent;

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
    fixture = TestBed.createComponent(AzureProviderSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeAzureCluster();
    component.cluster.spec.cloud.azure = {
      clientID: '',
      clientSecret: '',
      resourceGroup: '',
      routeTable: '',
      securityGroup: '',
      subnet: '',
      subscriptionID: '',
      tenantID: '',
      vnet: '',
    };
    fixture.detectChanges();
  });

  it('should create the azure provider settings cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.azureProviderSettingsForm.valid).toBeFalsy();
  });

  it('form required values', () => {
    component.azureProviderSettingsForm.reset();
    fixture.detectChanges();

    expect(component.azureProviderSettingsForm.valid).toBeFalsy('form is invalid with empty defaults');
    expect(component.azureProviderSettingsForm.controls.clientID.hasError('required')).toBeTruthy('client ID field has required error');
    expect(component.azureProviderSettingsForm.controls.clientSecret.hasError('required')).toBeTruthy('client secret field has required error');
    expect(component.azureProviderSettingsForm.controls.tenantID.hasError('required')).toBeTruthy('tenant ID field has required error');
    expect(component.azureProviderSettingsForm.controls.subscriptionID.hasError('required')).toBeTruthy('subscription ID field has required error');

    component.azureProviderSettingsForm.controls.clientID.patchValue('foo');
    fixture.detectChanges();
    expect(component.azureProviderSettingsForm.controls.clientID.hasError('required')).toBeFalsy('client ID has no required error after setting value');
    expect(component.azureProviderSettingsForm.valid).toBeFalsy('form is still invalid after setting only client ID');

    component.azureProviderSettingsForm.controls.clientSecret.patchValue('bar');
    fixture.detectChanges();
    expect(component.azureProviderSettingsForm.controls.clientSecret.hasError('required')).toBeFalsy('client secret field has no required error after setting value');
    expect(component.azureProviderSettingsForm.valid).toBeFalsy('form is still invalid after setting both client ID and client secret');

    component.azureProviderSettingsForm.controls.tenantID.patchValue('tenant');
    fixture.detectChanges();
    expect(component.azureProviderSettingsForm.controls.tenantID.hasError('required')).toBeFalsy('tenant ID field has no required error after setting value');
    expect(component.azureProviderSettingsForm.valid).toBeFalsy('form is still invalid after setting client ID, client secret and tenant ID');

    component.azureProviderSettingsForm.controls.subscriptionID.patchValue('subscription');
    fixture.detectChanges();
    expect(component.azureProviderSettingsForm.controls.subscriptionID.hasError('required')).toBeFalsy('subscription ID field has no required error after setting value');
    expect(component.azureProviderSettingsForm.valid).toBeTruthy('form is still invalid after setting client ID, client secret, tenant ID and subscription ID');
  });
});
