import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TestBed, async, ComponentFixture } from '@angular/core/testing';

import { ProgressComponent } from './progress.component';
import { WizardActions } from '../../redux/actions/wizard.actions';

const modules: any[] = [
    BrowserModule,
    NgReduxTestingModule,
    BrowserAnimationsModule,
    SharedModule
];

function setMockNgRedux<T>(fixture: ComponentFixture<T>, step: number): void {
    const stepStub = MockNgRedux.getSelectorStub(['wizard', 'step']);
    stepStub.next(step);
}

function completeRedux() {
    const stepStub = MockNgRedux.getSelectorStub(['wizard', 'step']);
    stepStub.complete();
}

describe('ProgressComponent', () => {
    let fixture: ComponentFixture<ProgressComponent>;
    let component: ProgressComponent;

    beforeEach(async(() => {
        MockNgRedux.reset();
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                ProgressComponent
            ],
            providers: [
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProgressComponent);
        component = fixture.componentInstance;
    });

    it('should create the progress cmp', () => {
        expect(component).toBeTruthy();
    });

    it('should get step', () => {
        setMockNgRedux(fixture, 1);
        fixture.detectChanges();

        expect(component.step).toBe(1, 'should get step');

        completeRedux();
    });

    it('should return correct icon class', () => {
        setMockNgRedux(fixture, 1);
        fixture.detectChanges();

        expect(component.getIconClass(0)).toBe('fa fa-check');
        expect(component.getIconClass(1)).toBe('fa fa-circle-o-notch fa-spin');
        expect(component.getIconClass(2)).toBe('');

        completeRedux();
    });

    it('should return correct title class', () => {
        setMockNgRedux(fixture, 1);
        fixture.detectChanges();

        expect(component.getTitleClass(2)).toBe('title-unchecked');
        expect(component.getTitleClass(1)).toBe('');
        expect(component.getTitleClass(0)).toBe('');

        completeRedux();
    });

    it('should return correct cursor style', () => {
        setMockNgRedux(fixture, 1);
        fixture.detectChanges();

        expect(component.getCurser(2)).toBe('default');
        expect(component.getCurser(1)).toBe('default');
        expect(component.getCurser(0)).toBe('pointer');

        completeRedux();
    });

    it('should go to step', () => {
        const spyGoToStep = spyOn(WizardActions, 'goToStep');
        setMockNgRedux(fixture, 2);
        fixture.detectChanges();

        component.gotoStep(3);
        expect(spyGoToStep.and.callThrough()).not.toHaveBeenCalled();

        component.gotoStep(1);
        const args = spyGoToStep.calls.first().args[0];
        expect(spyGoToStep.and.callThrough()).toHaveBeenCalledTimes(1);
        expect(args).toBe(1, 'should call goToStep method with argument 1');
    });
});
