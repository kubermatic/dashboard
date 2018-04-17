import { SharedModule } from '../../../shared/shared.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { UpgradeClusterComponent } from './upgrade-cluster.component';
import { MatDialogRefMock } from './../../../testing/services/mat-dialog-ref-mock';
import { ApiService } from '../../../core/services/api/api.service';
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

describe('UpgradeClusterComponent', () => {
  let fixture: ComponentFixture<UpgradeClusterComponent>;
  let component: UpgradeClusterComponent;
  let editClusterSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['editCluster']);
    editClusterSpy = apiMock.editCluster.and.returnValue(asyncData(fakeDigitaloceanCluster));

    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        UpgradeClusterComponent
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { clusterName: 'clustername' } },
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: ApiService, useValue: apiMock },
      ],
    }).compileComponents();
  }));

  beforeEach(async(() => {
    fixture = TestBed.createComponent(UpgradeClusterComponent);
    component = fixture.componentInstance;
  }));

  it('should create the upgrade cluster component', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should call editCluster method from api', fakeAsync(() => {
    component.selectedVersion = 'new version';
    component.cluster = fakeDigitaloceanCluster;
    component.datacenter = fakeDigitaloceanDatacenter;
    component.possibleVersions = ['1.9.5'];

    fixture.detectChanges();
    component.upgrade();
    tick();
    expect(editClusterSpy.and.callThrough()).toHaveBeenCalledTimes(1);
  }));
});
