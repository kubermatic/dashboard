import { AuthMockService } from './../../../testing/services/auth-mock.service';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { By } from '@angular/platform-browser';
import {TestBed, async, ComponentFixture} from '@angular/core/testing';

import { BreadcrumbsComponent } from './breadcrumbs.component';
import { ApiService } from './../../services/api/api.service';
import { Auth } from '../../services/index';
import { RouterStub } from '../../../testing/router-stubs';

const modules: any[] = [
    BrowserModule,
    HttpClientModule,
    RouterTestingModule,
    NgReduxTestingModule,
    BrowserAnimationsModule
];

describe('BreadcrumbsComponent', () => {
    let fixture: ComponentFixture<BreadcrumbsComponent>;
    let component: BreadcrumbsComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                BreadcrumbsComponent
            ],
            providers: [
                ApiService,
                { provide: Auth, useClass: AuthMockService }
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BreadcrumbsComponent);
        component = fixture.componentInstance;
    });

    it('should create the Breadcrumbs', () => {
        expect(component).toBeTruthy();
    });
});
