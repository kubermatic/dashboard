import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { of } from 'rxjs';
import { SharedModule } from '../../../shared/shared.module';

import { MatDialogRef } from '@angular/material';
import { ApiService } from '../../../core/services/api/api.service';
import { GoogleAnalyticsService } from '../../../google-analytics.service';
import { fakeDigitaloceanCluster } from '../../../testing/fake-data/cluster.fake';
import { fakeDigitaloceanDatacenter } from '../../../testing/fake-data/datacenter.fake';
import { nodeFake } from '../../../testing/fake-data/node.fake';
import { fakeProject } from '../../../testing/fake-data/project.fake';
import { ApiMockService } from '../../../testing/services/api-mock.service';
import { MatDialogRefMock } from './../../../testing/services/mat-dialog-ref-mock';
import { NodeDeleteConfirmationComponent } from './node-delete-confirmation.component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('NodeDeleteConfirmationComponent', () => {
  let fixture: ComponentFixture<NodeDeleteConfirmationComponent>;
  let component: NodeDeleteConfirmationComponent;
  let apiService: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        NodeDeleteConfirmationComponent
      ],
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: ApiService, useClass: ApiMockService },
        GoogleAnalyticsService
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeDeleteConfirmationComponent);
    component = fixture.componentInstance;

    apiService = fixture.debugElement.injector.get(ApiService);
  });

  it('should create the add node modal cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should call deleteClusterNode', fakeAsync(() => {
    component.cluster = fakeDigitaloceanCluster();
    component.node = nodeFake();
    component.datacenter = fakeDigitaloceanDatacenter();
    component.projectID = fakeProject().id;

    fixture.detectChanges();
    const spyDeleteClusterNode = spyOn(apiService, 'deleteClusterNode').and.returnValue(of(null));

    component.deleteNode();
    tick();

    expect(spyDeleteClusterNode.and.callThrough()).toHaveBeenCalledTimes(1);
  }));
});
