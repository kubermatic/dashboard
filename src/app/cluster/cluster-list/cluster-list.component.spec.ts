import { Http } from '@angular/http';
import { SharedModule } from '../../shared/shared.module';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture, inject, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from './../../testing/router-stubs';
import { click } from './../../testing/utils/click-handler';
import { DebugElement } from '@angular/core';

import { ClusterListComponent } from './cluster-list.component';
import { ClusterItemComponent } from './cluster-item/cluster-item.component';
import { Auth } from './../../core/services/auth/auth.service';
import { ApiService } from '../../core/services/api/api.service';
import { AuthMockService } from '../../testing/services/auth-mock.service';

const modules: any[] = [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    SlimLoadingBarModule.forRoot(),
    RouterTestingModule,
    SharedModule
];

describe('ClusterListComponent', () => {
    let fixture: ComponentFixture<ClusterListComponent>;
    let component: ClusterListComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                ClusterListComponent,
                ClusterItemComponent
            ],
            providers: [
                ApiService,
                { provide: Auth, useClass: AuthMockService }
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ClusterListComponent);
        component = fixture.componentInstance;
    });

    it('should create the cluster list cmp', async(() => {
        expect(component).toBeTruthy();
    }));
});
