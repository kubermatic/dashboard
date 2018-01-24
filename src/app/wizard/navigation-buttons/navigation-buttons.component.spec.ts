import { NavigationButtonsComponent } from './navigation-buttons.component';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';

import { By } from '@angular/platform-browser';
import {TestBed, async, ComponentFixture} from '@angular/core/testing';

import { RouterStub } from '../../testing/router-stubs';
import { DatacenterService } from '../../core/services/index';
import { DatacenterMockService } from '../../testing/services/datacenter-mock.service';

const modules: any[] = [
    BrowserModule,
    HttpClientModule,
    RouterTestingModule,
    NgReduxTestingModule,
    BrowserAnimationsModule
];

function setMockNgRedux<T>(fixture: ComponentFixture<T>, step: number, valid: Map<number, boolean>): void {
    const stepStub = MockNgRedux.getSelectorStub(['wizard', 'step']);
    stepStub.next(step);
    stepStub.complete();
    const validStub = MockNgRedux.getSelectorStub(['wizard', 'valid']);
    validStub.next(valid);
    validStub.complete();
}

describe('NavigationButtonsComponent', () => {
    let fixture: ComponentFixture<NavigationButtonsComponent>;
    let component: NavigationButtonsComponent;

    beforeEach(() => {
        MockNgRedux.reset();
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                NavigationButtonsComponent
            ],
            providers: [
                { provide: DatacenterService, useClass: DatacenterMockService }
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(NavigationButtonsComponent);
        component = fixture.componentInstance;
    });

    it('should create the Breadcrumbs', () => {
        expect(component).toBeTruthy();
    });
});
