import { AddNodeStubsModule } from './../../../testing/components/add-node-stubs';
import { FormBuilder } from '@angular/forms';
import { AddNodeModalData } from './../../../shared/model/add-node-modal-data';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgReduxTestingModule } from '@angular-redux/store/lib/testing/ng-redux-testing.module';

import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule, ActivatedRouteStub, RouterStub } from './../../../testing/router-stubs';
import { click } from './../../../testing/utils/click-handler';
import { DebugElement } from '@angular/core';

import { ApiService } from '../../../core/services/api/api.service';
import { ApiMockService } from '../../../testing/services/api-mock.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { AddNodeModalComponent } from './add-node-modal.component';
import { InputValidationService } from '../../../core/services/input-validation/input-validation.service';
import { clusterFake } from './../../../testing/fake-data/cluster.fake';
import { nodeModelFake } from './../../../testing/fake-data/node.fake';
import { AddNodeStubComponent } from '../../../testing/components/add-node-stubs';

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

        expect(component.provider.name).toBe(cluster.provider, 'Provider name should be obtained from mat dialog data');
        expect(component.provider.payload.token).toBe(cluster.spec.cloud.digitalocean.token, 'Digitalocean token should be obtained from mat dialog data');
    });

    it('should call createClusterNode method from the api', fakeAsync(() => {
        component.nodeModel = nodeModelFake;
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
