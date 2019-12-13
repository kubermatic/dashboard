import {EventEmitter} from '@angular/core';
import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import Spy = jasmine.Spy;
import {SharedModule} from '../../../shared/shared.module';
import {doPatchCloudSpecFake} from '../../../testing/fake-data/cloud-spec.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {asyncData} from '../../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../../testing/services/mat-dialog-ref-mock';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {EditClusterComponent} from './edit-cluster.component';
import {ClusterService, ProviderSettingsPatch} from '../../../core/services/cluster/cluster.service';
import {fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {EditProviderSettingsComponent} from '../edit-provider-settings/edit-provider-settings.component';
import {AWSProviderSettingsComponent} from '../edit-provider-settings/aws-provider-settings/aws-provider-settings.component';
import {AzureProviderSettingsComponent} from '../edit-provider-settings/azure-provider-settings/azure-provider-settings.component';
import {DigitaloceanProviderSettingsComponent} from '../edit-provider-settings/digitalocean-provider-settings/digitalocean-provider-settings.component';
import {GCPProviderSettingsComponent} from '../edit-provider-settings/gcp-provider-settings/gcp-provider-settings.component';
import {HetznerProviderSettingsComponent} from '../edit-provider-settings/hetzner-provider-settings/hetzner-provider-settings.component';
import {KubevirtProviderSettingsComponent} from '../edit-provider-settings/kubevirt-provider-settings/kubevirt-provider-settings.component';
import {OpenstackProviderSettingsComponent} from '../edit-provider-settings/openstack-provider-settings/openstack-provider-settings.component';
import {PacketProviderSettingsComponent} from '../edit-provider-settings/packet-provider-settings/packet-provider-settings.component';
import {VSphereProviderSettingsComponent} from '../edit-provider-settings/vsphere-provider-settings/vsphere-provider-settings.component';
import {Subject} from 'rxjs';
import {CoreModule} from '../../../core/core.module';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
  CoreModule,
];

describe('EditClusterComponent', () => {
  let fixture: ComponentFixture<EditClusterComponent>;
  let component: EditClusterComponent;
  let editClusterSpy: Spy;

  beforeEach(async(() => {
    const clusterServiceMock = jasmine.createSpyObj('ClusterService', ['patch', 'changeProviderSettingsPatch']);
    clusterServiceMock.providerSettingsPatchChanges$ = new EventEmitter<ProviderSettingsPatch>();
    clusterServiceMock.onClusterUpdate = new Subject<void>();
    editClusterSpy = clusterServiceMock.patch.and.returnValue(asyncData(fakeDigitaloceanCluster()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            EditClusterComponent,
            EditProviderSettingsComponent,
            AWSProviderSettingsComponent,
            DigitaloceanProviderSettingsComponent,
            HetznerProviderSettingsComponent,
            OpenstackProviderSettingsComponent,
            VSphereProviderSettingsComponent,
            AzureProviderSettingsComponent,
            PacketProviderSettingsComponent,
            GCPProviderSettingsComponent,
            KubevirtProviderSettingsComponent,
          ],
          providers: [
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: ClusterService, useValue: clusterServiceMock},
          ],
        })
        .compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(EditClusterComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    component.datacenter = fakeDigitaloceanDatacenter();
    component.projectID = fakeProject().id;
    component.labels = {};
    component.asyncLabelValidators = [];
    fixture.detectChanges();
  }));

  it('should create the edit cluster component', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should have valid form after creating', () => {
    expect(component.form.valid).toBeTruthy();
  });

  it('should have required fields', () => {
    component.form.controls.name.patchValue('');
    expect(component.form.valid).toBeFalsy('form is not valid');
    expect(component.form.controls.name.valid).toBeFalsy('name field is not valid');
    expect(component.form.controls.name.hasError('required')).toBeTruthy('name field has required error');

    component.form.controls.name.patchValue('new-cluster-name');
    expect(component.form.controls.name.hasError('required'))
        .toBeFalsy('name field has no required error after setting name');
  });

  it('should call editCluster method', fakeAsync(() => {
       component.providerSettingsPatch = doPatchCloudSpecFake();
       fixture.detectChanges();

       component.form.controls.name.patchValue('new-cluster-name');
       component.editCluster();
       tick();

       expect(editClusterSpy.and.callThrough()).toHaveBeenCalled();
     }));
});
