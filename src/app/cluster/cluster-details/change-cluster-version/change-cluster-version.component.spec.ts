import { SharedModule } from '../../../shared/shared.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ChangeClusterVersionComponent } from './change-cluster-version.component';
import { MatDialogRefMock } from './../../../testing/services/mat-dialog-ref-mock';
import { ApiService, ProjectService } from '../../../core/services';
import { ProjectMockService } from './../../../testing/services/project-mock.service';
import { asyncData } from '../../../testing/services/api-mock.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { fakeDigitaloceanCluster } from '../../../testing/fake-data/cluster.fake';
import Spy = jasmine.Spy;
import { fakeDigitaloceanDatacenter } from '../../../testing/fake-data/datacenter.fake';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('ChangeClusterVersionComponent', () => {
  let fixture: ComponentFixture<ChangeClusterVersionComponent>;
  let component: ChangeClusterVersionComponent;
  let editClusterSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['editCluster']);
    editClusterSpy = apiMock.editCluster.and.returnValue(asyncData(fakeDigitaloceanCluster));

    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        ChangeClusterVersionComponent
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { clusterName: 'clustername' } },
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: ApiService, useValue: apiMock },
        { provide: ProjectService, useClass: ProjectMockService }
      ],
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(ChangeClusterVersionComponent);
    component = fixture.componentInstance;
  }));

  it('should create the change cluster version component', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should call editCluster method from api', fakeAsync(() => {
    component.selectedVersion = 'new version';
    component.cluster = fakeDigitaloceanCluster;
    component.datacenter = fakeDigitaloceanDatacenter;
    component.possibleVersions = ['1.9.5'];

    fixture.detectChanges();
    component.changeVersion();
    tick();
    expect(editClusterSpy.and.callThrough()).toHaveBeenCalledTimes(1);
  }));
});
