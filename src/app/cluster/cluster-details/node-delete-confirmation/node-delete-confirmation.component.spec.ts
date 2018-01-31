import { CustomEventServiceMock } from './../../../testing/services/custom-event-mock.service';
import { CustomEventService } from 'app/core/services';
import { Observable } from 'rxjs/Observable';
import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture, fakeAsync, tick, inject } from '@angular/core/testing';
import { click } from './../../../testing/utils/click-handler';
import { DebugElement } from '@angular/core';

import { MatDialogRefMock } from './../../../testing/services/mat-dialog-ref-mock';
import { ApiService } from '../../../core/services/api/api.service';
import { ApiMockService } from '../../../testing/services/api-mock.service';
import { MatDialogRef } from '@angular/material';
import { CreateNodesService } from '../../../core/services/index';
import { NodeDeleteConfirmationComponent } from './node-delete-confirmation.component';

const modules: any[] = [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    SlimLoadingBarModule.forRoot(),
    SharedModule
];

describe('NodeDeleteConfirmationComponent', () => {
    let fixture: ComponentFixture<NodeDeleteConfirmationComponent>;
    let component: NodeDeleteConfirmationComponent;
    let apiService: ApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                NodeDeleteConfirmationComponent
            ],
            providers: [
                { provide: CustomEventService, useClass: CustomEventServiceMock },
                { provide: MatDialogRef, useClass: MatDialogRefMock },
                { provide: ApiService, useClass: ApiMockService },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(NodeDeleteConfirmationComponent);
        component = fixture.componentInstance;

        apiService = fixture.debugElement.injector.get(ApiService);
    });

    it('should create the add node modal cmp', async(() => {
        expect(component).toBeTruthy();
    }));

    it('should call deleteClusterNode', fakeAsync(() => {
        fixture.detectChanges();
        component.clusterName = 'cluster-name';
        component.nodeName = 'node-name';
        component.onNodeRemoval = function() {};
        const spyDeleteClusterNode = spyOn(apiService, 'deleteClusterNode').and.returnValue(Observable.of(null));

        component.deleteNode();
        tick();

        expect(spyDeleteClusterNode.and.callThrough()).toHaveBeenCalledTimes(1);
    }));
});
