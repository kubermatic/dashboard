import { NgReduxTestingModule } from '@angular-redux/store/lib/testing/ng-redux-testing.module';
import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { ApiService } from '../../../core/services';
import { SharedModule } from '../../../shared/shared.module';
import { fakeDigitaloceanCluster } from '../../../testing/fake-data/cluster.fake';
import { fakeDigitaloceanDatacenter } from '../../../testing/fake-data/datacenter.fake';
import { fakeProject } from '../../../testing/fake-data/project.fake';
import { RouterTestingModule } from '../../../testing/router-stubs';
import { ShareKubeconfigComponent } from './share-kubeconfig.component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  NgReduxTestingModule,
  SharedModule,
];

describe('ShareKubeconfigComponent', () => {
  let component: ShareKubeconfigComponent;
  let fixture: ComponentFixture<ShareKubeconfigComponent>;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getShareKubeconfigURL']);
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [ShareKubeconfigComponent],
      providers: [
        { provide: ApiService, useValue: apiMock },
        { provide: MAT_DIALOG_DATA, useValue: { cluster: fakeDigitaloceanCluster() } },
        { provide: MatDialogRef, useValue: {} },
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareKubeconfigComponent);
    component = fixture.componentInstance;
    component.projectID = fakeProject().id;
    component.cluster = fakeDigitaloceanCluster();
    component.datacenter = fakeDigitaloceanDatacenter();

    fixture.detectChanges();
  });

  it('hould create the share kubeconfig component', () => {
    expect(component).toBeTruthy();
  });
});
