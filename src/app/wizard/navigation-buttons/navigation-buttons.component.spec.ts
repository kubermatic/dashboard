import { DataCenterEntity } from './../../shared/entity/DatacenterEntity';
import { datacentersFake } from './../../testing/fake-data/datacenter.fake';
import { NavigationButtonsComponent } from './navigation-buttons.component';
import { BrowserModule } from '@angular/platform-browser';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';

import { DatacenterService } from '../../core/services/index';
import { DatacenterMockService } from '../../testing/services/datacenter-mock.service';
import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';

const modules: any[] = [
    BrowserModule,
    NgReduxTestingModule,
    BrowserAnimationsModule
];

function setMockNgRedux<T>(fixture: ComponentFixture<T>, step: number, valid: Map<string, boolean>): void {
    const stepStub = MockNgRedux.getSelectorStub(['wizard', 'step']);
    stepStub.next(step);
    const validStub = MockNgRedux.getSelectorStub(['wizard', 'valid']);
    validStub.next(valid);
}

function completeRedux() {
    const stepStub = MockNgRedux.getSelectorStub(['wizard', 'step']);
    stepStub.complete();
    const validStub = MockNgRedux.getSelectorStub(['wizard', 'valid']);
    validStub.complete();
}

describe('NavigationButtonsComponent', () => {
    let fixture: ComponentFixture<NavigationButtonsComponent>;
    let component: NavigationButtonsComponent;

    beforeEach(async(() => {
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
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(NavigationButtonsComponent);
        component = fixture.componentInstance;
    });

    it('should create the Breadcrumbs', () => {
        expect(component).toBeTruthy();
    });

    it('canGoToStep should works', () => {
        const valid: Map<string, boolean> = new Map([
            ['clusterNameForm', false]
        ]);
        const ngRedux = fixture.debugElement.injector.get(NgRedux);
        const spyGetState = spyOn(ngRedux, 'getState').and.returnValue({ wizard: { valid } });
        setMockNgRedux(fixture, 0, valid);
        fixture.detectChanges();
        expect(component.nextStep).toBeFalsy();
        valid.set('clusterNameForm', true);
        setMockNgRedux(fixture, 0, valid);
        fixture.detectChanges();

        expect(component.nextStep).toBeTruthy();

        setMockNgRedux(fixture, 4, valid);
        fixture.detectChanges();

        expect(component.nextStep).toBeTruthy();

        completeRedux();
    });

    it('should get datacenters', fakeAsync(() => {
        const datacenters: { [key: string]: DataCenterEntity[] } = {
            [datacentersFake[0].spec.provider]: [datacentersFake[0]],
            [datacentersFake[1].spec.provider]: [datacentersFake[1]]
        };

        fixture.detectChanges();
        tick();

        expect(component.datacenters).toEqual(datacenters, 'should get datacenters');
    }));
});
