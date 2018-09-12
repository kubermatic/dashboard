import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterStub, RouterTestingModule } from './../../../testing/router-stubs';

import { MatDialogRefMock } from './../../../testing/services/mat-dialog-ref-mock';
import { ApiService } from '../../../core/services/api/api.service';
import { ApiMockService } from '../../../testing/services/api-mock.service';
import { DatacenterService } from '../../../core/services/datacenter/datacenter.service';
import { DatacenterMockService } from '../../../testing/services/datacenter-mock.service';
import { MatDialogRef } from '@angular/material';
import { ClusterDeleteConfirmationComponent } from './cluster-delete-confirmation.component';
import { fakeDigitaloceanDatacenter } from '../../../testing/fake-data/datacenter.fake';
import { fakeDigitaloceanCluster } from '../../../testing/fake-data/cluster.fake';
import { fakeProject } from '../../../testing/fake-data/project.fake';
import { InitialNodeDataService } from '../../../core/services';
import { GoogleAnalyticsService } from '../../../google-analytics.service';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule
];

describe('ClusterDeleteConfirmationComponent', () => {
  let fixture: ComponentFixture<ClusterDeleteConfirmationComponent>;
  let component: ClusterDeleteConfirmationComponent;
  let apiService: ApiService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        ClusterDeleteConfirmationComponent
      ],
      providers: [
        InitialNodeDataService,
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: ApiService, useClass: ApiMockService },
        { provide: DatacenterService, useClass: DatacenterMockService },
        { provide: Router, useClass: RouterStub },
        GoogleAnalyticsService
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterDeleteConfirmationComponent);
    component = fixture.componentInstance;

    apiService = fixture.debugElement.injector.get(ApiService);
    router = fixture.debugElement.injector.get(Router);
  });

  it('should create the add node modal cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should able add button', () => {
    component.projectID = fakeProject().id;
    component.cluster = fakeDigitaloceanCluster();
    component.datacenter = fakeDigitaloceanDatacenter();

    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('#name'));
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
    const spyDeleteCluster = spyOn(apiService, 'deleteCluster').and.returnValue(Observable.of(null));

    component.deleteCluster();
    tick();

    expect(spyDeleteCluster.and.callThrough()).toHaveBeenCalled();
  }));
});
