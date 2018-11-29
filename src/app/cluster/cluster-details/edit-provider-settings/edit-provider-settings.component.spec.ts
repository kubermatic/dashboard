import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ApiService, ClusterService, ProjectService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {ApiMockService} from '../../../testing/services/api-mock.service';
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
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: MatDialogRef, useClass: MatDialogRefMock},
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
});
