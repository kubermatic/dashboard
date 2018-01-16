import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { SharedModule } from '../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture, inject, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule, RouterLinkStubDirective, ActivatedRouteStub, RouterStub } from './../../testing/router-stubs';
import { DebugElement } from '@angular/core';

import { ClusterDetailsComponent } from './cluster-details.component';
import { CustomEventService } from './../../core/services/custom-event/custom-event.service';
import { Auth } from './../../core/services/auth/auth.service';
import { AuthMockService } from '../../testing/services/auth-mock.service';
import { ApiService } from '../../core/services/api/api.service';
import { ApiMockService } from '../../testing/services/api-mock.service';
import { ClusterHealthStatusComponent } from '../cluster-health-status/cluster-health-status.component';
import { NodeComponent } from './node/node.component';
import { ClusterSecretsComponent } from './cluster-secrets/cluster-secrets.component';
import { MatDialog } from '@angular/material';
import { CreateNodesService, DatacenterService } from '../../core/services/index';
import { DatacenterMockService } from '../../testing/services/datacenter-mock.service';
import { LocalStorageService } from '../../core/services/local-storage/local-storage.service';

const modules: any[] = [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    SlimLoadingBarModule.forRoot(),
    RouterTestingModule,
    SharedModule
];

describe('ClusterDetailsComponent', () => {
    let fixture: ComponentFixture<ClusterDetailsComponent>;
    let component: ClusterDetailsComponent;
    let activatedRoute: ActivatedRouteStub;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                ClusterDetailsComponent,
                ClusterHealthStatusComponent,
                ClusterSecretsComponent,
                NodeComponent
            ],
            providers: [
                CustomEventService,
                MatDialog,
                CreateNodesService,
                LocalStorageService,
                { provide: DatacenterService, useClass: DatacenterMockService },
                { provide: ApiService, useClass: ApiMockService },
                { provide: Auth, useClass: AuthMockService },
                { provide: Router, useClass: RouterStub },
                { provide: ActivatedRoute, useClass: ActivatedRouteStub }
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ClusterDetailsComponent);
        component = fixture.componentInstance;

        activatedRoute = fixture.debugElement.injector.get(ActivatedRoute) as any;
        activatedRoute.testParamMap = { clusterName: 'tbbfvttvs' };
    });

    it('should create the cluster details cmp', async(() => {
        expect(component).toBeTruthy();
    }));
});
