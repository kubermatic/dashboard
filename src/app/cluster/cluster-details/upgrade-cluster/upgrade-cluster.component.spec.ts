import { SharedModule } from '../../../shared/shared.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { UpgradeClusterComponent } from './upgrade-cluster.component';
import { MatDialogRefMock } from './../../../testing/services/mat-dialog-ref-mock';
import { ApiService } from '../../../core/services/api/api.service';
import { ApiMockService } from '../../../testing/services/api-mock.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('UpgradeClusterComponent', () => {
  let fixture: ComponentFixture<UpgradeClusterComponent>;
  let component: UpgradeClusterComponent;
  let apiService: ApiService;

  beforeEach(() => {
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
        { provide: ApiService, useClass: ApiMockService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpgradeClusterComponent);
    component = fixture.componentInstance;

    apiService = fixture.debugElement.injector.get(ApiService);
  });

  it('should create the add node modal cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should call updateClusterUpgrade method from api', fakeAsync(() => {
    fixture.detectChanges();
    const spyUpdate = spyOn(apiService, 'updateClusterUpgrade');
    component.selectedVersion = 'new version';
    component.upgrade();
    tick();
    expect(spyUpdate.and.callThrough()).toHaveBeenCalledTimes(1);
  }));
});
