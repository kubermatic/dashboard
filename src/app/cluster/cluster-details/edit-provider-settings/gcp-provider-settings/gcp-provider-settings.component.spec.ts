import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {ApiService, ClusterService} from '../../../../core/services';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeGCPCluster} from '../../../../testing/fake-data/cluster.fake';
import {ApiMockService} from '../../../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../../../testing/services/mat-dialog-ref-mock';
import {AWSProviderSettingsComponent} from '../aws-provider-settings/aws-provider-settings.component';
import {AzureProviderSettingsComponent} from '../azure-provider-settings/azure-provider-settings.component';
import {DigitaloceanProviderSettingsComponent} from '../digitalocean-provider-settings/digitalocean-provider-settings.component';
import {EditProviderSettingsComponent} from '../edit-provider-settings.component';
import {HetznerProviderSettingsComponent} from '../hetzner-provider-settings/hetzner-provider-settings.component';
import {OpenstackProviderSettingsComponent} from '../openstack-provider-settings/openstack-provider-settings.component';
import {PacketProviderSettingsComponent} from '../packet-provider-settings/packet-provider-settings.component';
import {VSphereProviderSettingsComponent} from '../vsphere-provider-settings/vsphere-provider-settings.component';

import {GCPProviderSettingsComponent} from './gcp-provider-settings.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
];

describe('GCPProviderSettingsComponent', () => {
  let fixture: ComponentFixture<GCPProviderSettingsComponent>;
  let component: GCPProviderSettingsComponent;

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            EditProviderSettingsComponent,
            GCPProviderSettingsComponent,
            AWSProviderSettingsComponent,
            DigitaloceanProviderSettingsComponent,
            HetznerProviderSettingsComponent,
            OpenstackProviderSettingsComponent,
            VSphereProviderSettingsComponent,
            AzureProviderSettingsComponent,
            PacketProviderSettingsComponent,
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
    fixture = TestBed.createComponent(GCPProviderSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeGCPCluster();
    component.cluster.spec.cloud.gcp = {
      serviceAccount: '',
      network: '',
      subnetwork: '',
    };
    fixture.detectChanges();
  });

  it('should create the gcp provider settings cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid after creating', () => {
    expect(component.gcpProviderSettingsForm.valid).toBeFalsy();
  });

  it('form required values', () => {
    component.gcpProviderSettingsForm.reset();
    fixture.detectChanges();

    expect(component.gcpProviderSettingsForm.valid).toBeFalsy('form is invalid with empty defaults');
    expect(component.gcpProviderSettingsForm.controls.serviceAccount.hasError('required'))
        .toBeTruthy('service account id field has required error');

    component.gcpProviderSettingsForm.controls.serviceAccount.patchValue('foo');
    fixture.detectChanges();
    expect(component.gcpProviderSettingsForm.controls.serviceAccount.hasError('required'))
        .toBeFalsy('service account id has no required error after setting value');

    expect(component.gcpProviderSettingsForm.valid).toBeTruthy('form is valid after setting service account');
  });
});
