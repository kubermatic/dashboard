import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import Spy = jasmine.Spy;

import {ApiService, ClusterService, ProjectService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {doCloudSpecFake} from '../../../testing/fake-data/cloud-spec.fake';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {RouterStub} from '../../../testing/router-stubs';
import {asyncData} from '../../../testing/services/api-mock.service';
import {MatDialogRefMock} from '../../../testing/services/mat-dialog-ref-mock';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {AWSProviderSettingsComponent} from './aws-provider-settings/aws-provider-settings.component';
import {AzureProviderSettingsComponent} from './azure-provider-settings/azure-provider-settings.component';
import {DigitaloceanProviderSettingsComponent} from './digitalocean-provider-settings/digitalocean-provider-settings.component';
import {EditProviderSettingsComponent} from './edit-provider-settings.component';
import {HetznerProviderSettingsComponent} from './hetzner-provider-settings/hetzner-provider-settings.component';
import {OpenstackProviderSettingsComponent} from './openstack-provider-settings/openstack-provider-settings.component';
import {VSphereProviderSettingsComponent} from './vsphere-provider-settings/vsphere-provider-settings.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
];

describe('EditProviderSettingsComponent', () => {
  let fixture: ComponentFixture<EditProviderSettingsComponent>;
  let component: EditProviderSettingsComponent;
  let patchClusterSpy: Spy;

  beforeEach(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['patchCluster']);
    patchClusterSpy = apiMock.patchCluster.and.returnValue(asyncData(fakeDigitaloceanCluster));

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
            {provide: ApiService, useValue: apiMock},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: Router, useClass: RouterStub},
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProviderSettingsComponent);
    component = fixture.componentInstance;
    component.cluster = fakeDigitaloceanCluster();
    fixture.detectChanges();
  });

  it('should create the edit provider settings cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should call patchCluster method', fakeAsync(() => {
       component.cluster = fakeDigitaloceanCluster();
       component.datacenter = fakeDigitaloceanDatacenter();
       component.project = fakeProject();
       component.providerSettingsPatch = {
         isValid: true,
         cloudSpecPatch: doCloudSpecFake(),
       };

       fixture.detectChanges();

       component.saveProviderSettings();
       tick();

       expect(patchClusterSpy.and.callThrough()).toHaveBeenCalled();
     }));
});
