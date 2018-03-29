import { WizardStubsModule } from './../testing/components/wizard-stubs';
import { clusterFake } from './../testing/fake-data/cluster.fake';
import { AddNodeStubsModule } from './../testing/components/add-node-stubs';
import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';
import { ApiService, DatacenterService, InitialNodeDataService } from '../core/services';
import { WizardComponent } from './wizard.component';
import { Router } from '@angular/router';
import { SharedModule } from '..//shared/shared.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '../testing/router-stubs';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterStub } from './../testing/router-stubs';
import { asyncData } from '../testing/services/api-mock.service';
import { MatDialog } from '@angular/material';
import { MockNgRedux, NgReduxTestingModule } from '@angular-redux/store/testing';
import { DatacenterMockService } from '../testing/services/datacenter-mock.service';
import { CreateClusterModel } from '../shared/model/CreateClusterModel';
import { NodeEntity } from '../shared/entity/NodeEntity';
import { nodeCreateFake } from '../testing/fake-data/node.fake';
import { clusterFake1 } from '../testing/fake-data/cluster.fake';
import Spy = jasmine.Spy;

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  NgReduxTestingModule,
  SharedModule,
  WizardStubsModule,
  AddNodeStubsModule
];

function setMockNgRedux<T>(fixture: ComponentFixture<T>, provider: string, step: number): void {
  const stepStub = MockNgRedux.getSelectorStub(['wizard', 'step']);
  const providerStub = MockNgRedux.getSelectorStub(['wizard', 'setProviderForm', 'provider']);
  providerStub.next(provider);
  providerStub.complete();
  stepStub.next(step);
  stepStub.complete();
}

function setMockModels<T>(fixture: ComponentFixture<T>, nodeModel: NodeEntity, clusterModel: CreateClusterModel): void {
  const nodeModelStub = MockNgRedux.getSelectorStub(['wizard', 'nodeModel']);
  const clusterModelStub = MockNgRedux.getSelectorStub(['wizard', 'clusterModel']);
  nodeModelStub.next(nodeModel);
  nodeModelStub.complete();
  clusterModelStub.next(clusterModel);
  clusterModelStub.complete();
}

describe('WizardComponent', () => {
  let fixture: ComponentFixture<WizardComponent>;
  let component: WizardComponent;
  let router: Router;
  let createClusterSpy: Spy;
  let getClusterSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['createCluster', 'getCluster']);
    createClusterSpy = apiMock.createCluster.and.returnValue(asyncData(clusterFake1));
    getClusterSpy = apiMock.getCluster.and.returnValue(asyncData(clusterFake1));

    MockNgRedux.reset();
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        WizardComponent
      ],
      providers: [
        { provide: Router, useClass: RouterStub },
        { provide: ApiService, useValue: apiMock },
        { provide: DatacenterService, useClass: DatacenterMockService },
        MatDialog,
        InitialNodeDataService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardComponent);
    component = fixture.componentInstance;

    router = fixture.debugElement.injector.get(Router);
  });

  it('should create the sidenav cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should get step and provider from the store', () => {
    setMockNgRedux(fixture, 'provider', 1);
    fixture.detectChanges();

    expect(component.step).toBe(1, 'should get step');
    expect(component.selectedProvider).toBe('provider', 'should get provider');
  });

  it('should call methods after creating cluster', fakeAsync(() => {
    const spyNavigate = spyOn(router, 'navigate');
    const ngRedux = fixture.debugElement.injector.get(NgRedux);
    const spyGetState = spyOn(ngRedux, 'getState').and.returnValue({
      wizard: {
        nodeModel: nodeCreateFake,
        clusterModel: clusterFake,
        nodeForm: { node_count: 1 },
        setDatacenterForm: {
          datacenter: {
            spec: { seed: 'europe-west3-c' }
          }
        }
      }
    });
    setMockNgRedux(fixture, 'digitalocean', 5);
    fixture.detectChanges();
    tick();

    expect(component.selectedProvider).toBe('digitalocean', 'should get provider');
    expect(spyNavigate.and.callThrough()).toHaveBeenCalledTimes(1);
    expect(createClusterSpy.and.callThrough()).toHaveBeenCalledTimes(1);
  }));
});
