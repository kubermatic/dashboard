
import { WizardStubsModule } from './../testing/components/wizard-stubs';
import { clusterFake } from './../testing/fake-data/cluster.fake';
import { doClusterModelFake, doNodeModelFake } from './../testing/fake-data/wizard.fake';
import { CreateNodeModel } from 'app/shared/model/CreateNodeModel';
import { AddNodeStubsModule } from './../testing/components/add-node-stubs';
import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';
import { DatacenterService, LocalStorageService, ApiService } from '../core/services';
import { WizardComponent } from './wizard.component';
import { Router } from '@angular/router';
import { SharedModule } from '..//shared/shared.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '../testing/router-stubs';

import {TestBed, async, ComponentFixture, inject, fakeAsync, tick} from '@angular/core/testing';
import { RouterStub } from './../testing/router-stubs';

import { SetDatacenterComponent } from './set-datacenter/set-datacenter.component';
import { SetSettingsComponent } from './set-settings/set-settings.component';
import { ApiMockService } from '../testing/services/api-mock.service';
import { MatDialog } from '@angular/material';
import { CreateNodesService } from '../core/services/index';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BringyourownClusterComponent } from './set-settings/provider/cluster/bringyourown/bringyourown.component';
import { DatacenterMockService } from '../testing/services/datacenter-mock.service';
import { CreateClusterModel } from '../shared/model/CreateClusterModel';
import { Observable } from 'rxjs/Observable';

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

function setMockModels<T>(fixture: ComponentFixture<T>, nodeModel: CreateNodeModel, clusterModel: CreateClusterModel): void {
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
    let apiService: ApiService;

    beforeEach(() => {
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
                { provide: ApiService, useClass: ApiMockService },
                { provide: DatacenterService, useClass: DatacenterMockService },
                MatDialog,
                CreateNodesService,
                LocalStorageService,
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(WizardComponent);
        component = fixture.componentInstance;

        router = fixture.debugElement.injector.get(Router);
        apiService = fixture.debugElement.injector.get(ApiService);
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

    it('should call methods after craating cluster', fakeAsync(() => {
        const spyNavigate = spyOn(router, 'navigate');
        const spyCreateClusterNode = spyOn(apiService, 'createClusterNode').and.returnValue(Observable.of(null));
        const speGetCluster = spyOn(apiService, 'getCluster').and.returnValue(Observable.of(clusterFake));
        const ngRedux = fixture.debugElement.injector.get(NgRedux);
        const spyGetState = spyOn(ngRedux, 'getState').and.returnValue({
            wizard: {
                nodeModel: doNodeModelFake,
                clusterModel: doClusterModelFake,
                nodeForm: {node_count: 1}
            }
        });
        setMockNgRedux(fixture, 'provider', 5);
        fixture.detectChanges();
        tick();

        expect(spyNavigate.and.callThrough()).toHaveBeenCalledTimes(1);
        expect(spyCreateClusterNode.and.callThrough()).toHaveBeenCalledTimes(1);
        expect(speGetCluster.and.callThrough()).toHaveBeenCalledTimes(1);
    }));
});
