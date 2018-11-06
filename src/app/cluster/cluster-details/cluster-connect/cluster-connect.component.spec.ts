import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgReduxTestingModule } from '@angular-redux/store/lib/testing/ng-redux-testing.module';
import { HttpClientModule } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { ApiService } from '../../../core/services/api/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { fakeDigitaloceanCluster } from '../../../testing/fake-data/cluster.fake';
import { fakeDigitaloceanDatacenter } from '../../../testing/fake-data/datacenter.fake';
import { fakeProject } from '../../../testing/fake-data/project.fake';
import { RouterTestingModule } from '../../../testing/router-stubs';
import { ClusterConnectComponent } from './cluster-connect.component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  NgReduxTestingModule,
  SharedModule,
];

describe('ClusterConnectComponent', () => {
  let component: ClusterConnectComponent;
  let fixture: ComponentFixture<ClusterConnectComponent>;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getKubeconfigURL']);
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [ClusterConnectComponent],
      providers: [
        { provide: ApiService, useValue: apiMock },
        { provide: MAT_DIALOG_DATA, useValue: { cluster: fakeDigitaloceanCluster() } },
        { provide: MatDialogRef, useValue: {} },
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterConnectComponent);
    component = fixture.componentInstance;
    component.projectID = fakeProject().id;
    component.cluster = fakeDigitaloceanCluster();
    component.datacenter = fakeDigitaloceanDatacenter();

    fixture.detectChanges();
  });

  it('hould create the cluster connect component', () => {
    expect(component).toBeTruthy();
  });
});
