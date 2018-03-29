import { AddNodeStubsModule } from './../../../testing/components/add-node-stubs';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgReduxTestingModule } from '@angular-redux/store/lib/testing/ng-redux-testing.module';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRouteStub, RouterTestingModule } from './../../../testing/router-stubs';

import { ApiService } from '../../../core/services/api/api.service';
import { ApiMockService } from '../../../testing/services/api-mock.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { AddNodeModalComponent } from './add-node-modal.component';
import { InputValidationService } from '../../../core/services/input-validation/input-validation.service';
import { clusterFake } from './../../../testing/fake-data/cluster.fake';
import { addNodeModalFake } from './../../../testing/fake-data/addNodeModal.fake';
import { getProvider } from '../../../shared/entity/ClusterEntity';
import { nodeCreateFake } from '../../../testing/fake-data/node.fake';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  NgReduxTestingModule,
  SharedModule,
  AddNodeStubsModule
];

describe('AddNodeModalComponent', () => {
  let fixture: ComponentFixture<AddNodeModalComponent>;
  let component: AddNodeModalComponent;
  let apiService: ApiService;
  let activatedRoute: ActivatedRouteStub;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        AddNodeModalComponent,
      ],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { cluster: clusterFake } },
        { provide: MatDialogRef, useValue: {} },
        { provide: ApiService, useClass: ApiMockService },
        { provide: ActivatedRoute, useClass: ActivatedRouteStub },
        InputValidationService
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNodeModalComponent);
    component = fixture.componentInstance;

    activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
    activatedRoute.testParamMap = { clusterName: 'tbbfvttvs' };
    apiService = fixture.debugElement.injector.get(ApiService);
  });

  it('should create the add node modal cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should set the provider', () => {
    const cluster = clusterFake;
    fixture.detectChanges();

    expect(component.provider.name).toBe(getProvider(cluster), 'Provider name should be obtained from mat dialog data');
    expect(component.provider.payload.token).toBe(cluster.spec.cloud.digitalocean.token, 'Digitalocean token should be obtained from mat dialog data');
  });

  it('should call createClusterNode method from the api', fakeAsync(() => {
    component.nodeModel = nodeCreateFake;
    const formBuilder = fixture.debugElement.injector.get(FormBuilder);
    component.form = formBuilder.group({ node_count: 1 });
    component.data = addNodeModalFake;
    fixture.detectChanges();

    const spyCreateClusterNode = spyOn(apiService, 'createClusterNode').and.returnValue(Observable.of(null));

    component.addNode();
    tick();

    expect(spyCreateClusterNode.and.callThrough()).toHaveBeenCalled();
  }));

  it('should render mat-dialog-actinos', () => {
    const formBuilder = fixture.debugElement.injector.get(FormBuilder);
    component.form = formBuilder.group({});
    fixture.detectChanges();

    const de = fixture.debugElement.query(By.css('.mat-dialog-actions'));

    expect(de).not.toBeNull();
  });
});
