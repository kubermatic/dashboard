import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {ApiService, ClusterService} from '../../../../core/services';
import {SharedModule} from '../../../../shared/shared.module';
import {fakePacketCluster} from '../../../../testing/fake-data/cluster.fake';
import {ApiMockService} from '../../../../testing/services/api-mock.service';
import {ClusterMockService} from '../../../../testing/services/cluster-mock-service';
import {MatDialogRefMock} from '../../../../testing/services/mat-dialog-ref-mock';
import {AWSProviderSettingsComponent} from '../aws-provider-settings/aws-provider-settings.component';
import {AzureProviderSettingsComponent} from '../azure-provider-settings/azure-provider-settings.component';
import {DigitaloceanProviderSettingsComponent} from '../digitalocean-provider-settings/digitalocean-provider-settings.component';
import {EditProviderSettingsComponent} from '../edit-provider-settings.component';
import {GCPProviderSettingsComponent} from '../gcp-provider-settings/gcp-provider-settings.component';
import {HetznerProviderSettingsComponent} from '../hetzner-provider-settings/hetzner-provider-settings.component';
import {OpenstackProviderSettingsComponent} from '../openstack-provider-settings/openstack-provider-settings.component';
import {VSphereProviderSettingsComponent} from '../vsphere-provider-settings/vsphere-provider-settings.component';

import {PacketProviderSettingsComponent} from './packet-provider-settings.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
];

describe('PacketProviderSettingsComponent', () => {
  let fixture: ComponentFixture<PacketProviderSettingsComponent>;
  let component: PacketProviderSettingsComponent;

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            EditProviderSettingsComponent,
            AWSProviderSettingsComponent,
            PacketProviderSettingsComponent,
            HetznerProviderSettingsComponent,
            OpenstackProviderSettingsComponent,
            VSphereProviderSettingsComponent,
            AzureProviderSettingsComponent,
            DigitaloceanProviderSettingsComponent,
            PacketProviderSettingsComponent,
            GCPProviderSettingsComponent,
          ],
          providers: [
            {provide: ApiService, useClass: ApiMockService},
            {provide: ClusterService, useClass: ClusterMockService},
            {provide: MatDialogRef, useClass: MatDialogRefMock},
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PacketProviderSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakePacketCluster();
    component.cluster.spec.cloud.packet.billingCycle = '';
    component.cluster.spec.cloud.packet.apiKey = '';
    component.cluster.spec.cloud.packet.projectID = '';
    fixture.detectChanges();
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should initially have invalid form', () => {
    expect(component.packetProviderSettingsForm.valid).toBeFalsy();
  });

  it('should correctly verify form validity', () => {
    expect(component.packetProviderSettingsForm.valid).toBeFalsy('form is initially not valid');
    expect(component.packetProviderSettingsForm.controls.apiKey.valid).toBeFalsy('apiKey field is initially not valid');
    expect(component.packetProviderSettingsForm.controls.apiKey.hasError('required'))
        .toBeTruthy('apiKey field has initially required error');
    expect(component.packetProviderSettingsForm.controls.projectID.valid)
        .toBeFalsy('projectID field is initially not valid');
    expect(component.packetProviderSettingsForm.controls.projectID.hasError('required'))
        .toBeTruthy('projectID field has initially required error');
    expect(component.packetProviderSettingsForm.controls.billingCycle.valid)
        .toBeTruthy('billingCycle field is initially valid');
  });
});
