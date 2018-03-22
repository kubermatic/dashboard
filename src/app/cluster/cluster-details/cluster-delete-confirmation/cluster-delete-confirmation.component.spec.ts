import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture, fakeAsync, tick, inject } from '@angular/core/testing';
import { RouterTestingModule, RouterStub } from './../../../testing/router-stubs';
import { click } from './../../../testing/utils/click-handler';
import { DebugElement } from '@angular/core';

import { MatDialogRefMock } from './../../../testing/services/mat-dialog-ref-mock';
import { ApiService } from '../../../core/services/api/api.service';
import { ApiMockService } from '../../../testing/services/api-mock.service';
import { DatacenterService } from '../../../core/services/datacenter/datacenter.service';
import { DatacenterMockService } from '../../../testing/services/datacenter-mock.service';
import { MatDialogRef } from '@angular/material';
import { ClusterDeleteConfirmationComponent } from './cluster-delete-confirmation.component';
import { LocalStorageService } from './../../../core/services/local-storage/local-storage.service';
import { CreateNodesService } from '../../../core/services/index';
import { datacentersFake } from '../../../testing/fake-data/datacenter.fake';

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
        fixture.detectChanges();
        component.humanReadableName = 'cluster-name';
        const input = fixture.debugElement.query(By.css('#name'));
        const inputElement = input.nativeElement;
        inputElement.value = 'cluster-name';
        inputElement.dispatchEvent(new Event('blur'));

        expect(component.disableDeleteCluster).toBeTruthy();
    });

    it('should call deleteCluster method', fakeAsync(() => {
        fixture.detectChanges();
        component.clusterName = 'cluster-name';
        component.datacenter = datacentersFake[0];
        const spyDeleteCluster = spyOn(apiService, 'deleteCluster').and.returnValue(Observable.of(null));

        component.deleteCluster();
        tick();

        expect(spyDeleteCluster.and.callThrough()).not.toHaveBeenCalled();

        component.disableDeleteCluster = true;
        component.deleteCluster();
        tick();

        expect(spyDeleteCluster.and.callThrough()).toHaveBeenCalled();
    }));

    it('should call navigate to cluster list after deleting', fakeAsync(() => {
        fixture.detectChanges();
        component.clusterName = 'cluster-name';
        component.datacenter = datacentersFake[0];
        component.disableDeleteCluster = true;
        const spyNavigate = spyOn(router, 'navigate');

        component.deleteCluster();
        tick();

        const navArgs = spyNavigate.calls.first().args[0];

        expect(spyNavigate.and.callThrough()).toHaveBeenCalledTimes(1);
        expect(navArgs[0]).toBe('/clusters', 'should nav to the cluster list');
    }));
});
