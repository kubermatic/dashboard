import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {of} from 'rxjs';

import {AppConfigService} from '../../../app-config.service';
import {ClusterService, DatacenterService, NotificationService} from '../../../core/services';
import {SettingsService} from '../../../core/services/settings/settings.service';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeDigitaloceanCluster} from '../../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../../testing/fake-data/datacenter.fake';
import {fakeProject} from '../../../testing/fake-data/project.fake';
import {RouterStub, RouterTestingModule} from '../../../testing/router-stubs';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {ClusterMockService} from '../../../testing/services/cluster-mock-service';
import {DatacenterMockService} from '../../../testing/services/datacenter-mock.service';
import {MatDialogRefMock} from '../../../testing/services/mat-dialog-ref-mock';
import {SettingsMockService} from '../../../testing/services/settings-mock.service';

import {ClusterDeleteConfirmationComponent} from './cluster-delete-confirmation.component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  RouterTestingModule,
  SharedModule,
];

describe('ClusterDeleteConfirmationComponent', () => {
  let fixture: ComponentFixture<ClusterDeleteConfirmationComponent>;
  let component: ClusterDeleteConfirmationComponent;
  let clusterService: ClusterService;

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            ClusterDeleteConfirmationComponent,
          ],
          providers: [
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: ClusterService, useClass: ClusterMockService},
            {provide: DatacenterService, useClass: DatacenterMockService},
            {provide: Router, useClass: RouterStub},
            GoogleAnalyticsService,
            {provide: AppConfigService, useClass: AppConfigMockService},
            {provide: SettingsService, useClass: SettingsMockService},
            NotificationService,
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterDeleteConfirmationComponent);
    component = fixture.componentInstance;

    clusterService = fixture.debugElement.injector.get(ClusterService);
    fixture.debugElement.injector.get(Router);
  });

  it('should initialize', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should able add button', () => {
    component.projectID = fakeProject().id;
    component.cluster = fakeDigitaloceanCluster();
    component.datacenter = fakeDigitaloceanDatacenter();

    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('#km-delete-cluster-dialog-input'));
    const inputElement = input.nativeElement;
    inputElement.value = fakeDigitaloceanCluster().name;

    inputElement.dispatchEvent(new Event('blur'));

    expect(component.inputNameMatches()).toBeTruthy();
  });

  it('should call deleteCluster method', fakeAsync(() => {
       component.cluster = fakeDigitaloceanCluster();
       component.datacenter = fakeDigitaloceanDatacenter();
       component.inputName = fakeDigitaloceanCluster().name;
       component.projectID = fakeProject().id;

       fixture.detectChanges();
       const spyDeleteCluster = jest.spyOn(clusterService, 'delete').mockReturnValue(of(null));

       component.deleteCluster();
       tick();

       expect(spyDeleteCluster).toHaveBeenCalled();
     }));
});
