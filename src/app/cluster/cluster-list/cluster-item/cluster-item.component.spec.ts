import { DatacenterMockService } from './../../../testing/services/datacenter-mock.service';
import { Http } from '@angular/http';
import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture, inject, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from './../../../testing/router-stubs';
import { click } from './../../../testing/utils/click-handler';
import { DebugElement } from '@angular/core';

import { ClusterItemComponent } from './cluster-item.component';
import { Auth } from './../../../core/services/auth/auth.service';
import { AuthMockService } from '../../../testing/services/auth-mock.service';
import { DatacenterService } from '../../../core/services/index';

const modules: any[] = [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    SlimLoadingBarModule.forRoot(),
    RouterTestingModule,
    SharedModule
];

describe('ClusterItemComponent', () => {
    let fixture: ComponentFixture<ClusterItemComponent>;
    let component: ClusterItemComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                ClusterItemComponent
            ],
            providers: [
                { provide: DatacenterService, useClass: DatacenterMockService },
                { provide: Auth, useClass: AuthMockService }
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ClusterItemComponent);
        component = fixture.componentInstance;
    });

    it('should create the cluster item cmp', async(() => {
        expect(component).toBeTruthy();
    }));
});
