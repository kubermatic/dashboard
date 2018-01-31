import { SharedModule } from '../../../../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TestBed, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';

import { WizardActions } from '../../../../../redux/actions/wizard.actions';
import { BringyourownClusterComponent } from './bringyourown.component';

const modules: any[] = [
    BrowserModule,
    NgReduxTestingModule,
    BrowserAnimationsModule,
    SharedModule
];

describe('BringyourownClusterComponent', () => {
    let fixture: ComponentFixture<BringyourownClusterComponent>;
    let component: BringyourownClusterComponent;

    beforeEach(async(() => {
        MockNgRedux.reset();
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                BringyourownClusterComponent
            ],
            providers: [
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(BringyourownClusterComponent);
        component = fixture.componentInstance;
    });

    it('should create the BYO cluster cmp', () => {
        expect(component).toBeTruthy();
    });

    it('should set cloud spec and go to next step', fakeAsync(() => {
        const spySetCloudSpec = spyOn(WizardActions, 'setCloudSpec');
        const spyNextStep = spyOn(WizardActions, 'nextStep');

        fixture.detectChanges();

        expect(spySetCloudSpec.and.callThrough()).toHaveBeenCalledTimes(1);

        tick();
        fixture.detectChanges();

        expect(spyNextStep.and.callThrough()).toHaveBeenCalledTimes(1);
    }));
});
