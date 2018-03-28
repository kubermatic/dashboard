import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
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
import { LocalStorageService } from './../../../core/services/local-storage/local-storage.service';
import { CreateNodesService } from '../../../core/services/index';
import { datacenterFake1 } from '../../../testing/fake-data/datacenter.fake';
import { clusterFake1 } from '../../../testing/fake-data/cluster.fake';

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
        CreateNodesService,
        LocalStorageService,
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: ApiService, useClass: ApiMockService },
        { provide: DatacenterService, useClass: DatacenterMockService },
        { provide: Router, useClass: RouterStub },
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
    component.cluster = clusterFake1;
    component.datacenter = datacenterFake1;

    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('#name'));
    const inputElement = input.nativeElement;
    inputElement.value = clusterFake1.spec.humanReadableName;
    inputElement.dispatchEvent(new Event('blur'));

    expect(component.inputNameMatches()).toBeTruthy();
  });

  it('should call deleteCluster method', fakeAsync(() => {
    component.cluster = clusterFake1;
    component.datacenter = datacenterFake1;

    fixture.detectChanges();
    const spyDeleteCluster = spyOn(apiService, 'deleteCluster').and.returnValue(Observable.of(null));

    component.deleteCluster();
    tick();

    expect(spyDeleteCluster.and.callThrough()).toHaveBeenCalled();
  }));
});
