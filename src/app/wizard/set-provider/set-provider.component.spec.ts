import { SetProviderComponent } from './set-provider.component';
import { datacentersFake } from './../../testing/fake-data/datacenter.fake';
import { DataCenterEntity } from 'app/shared/entity/DatacenterEntity';
import { DatacenterService } from './../../core/services/datacenter/datacenter.service';
import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TestBed, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';

import { WizardActions } from '../../redux/actions/wizard.actions';
import { InputValidationService } from '../../core/services';
import { ReactiveFormsModule } from '@angular/forms';
import { DatacenterMockService } from '../../testing/services/datacenter-mock.service';

const modules: any[] = [
    BrowserModule,
    NgReduxTestingModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    SharedModule
];

function setMockNgRedux(provider: string): void {
    const providerStub = MockNgRedux.getSelectorStub(['wizard', 'setProviderForm', 'provider']);
    providerStub.next(provider);
}

function completeRedux() {
    const providerStub = MockNgRedux.getSelectorStub(['wizard', 'setProviderForm', 'provider']);
    providerStub.complete();
}

describe('SetProviderComponent', () => {
    let fixture: ComponentFixture<SetProviderComponent>;
    let component: SetProviderComponent;
    let dcService: DatacenterService;

    beforeEach(async(() => {
        MockNgRedux.reset();
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                SetProviderComponent
            ],
            providers: [
                InputValidationService,
                { provide: DatacenterService, useClass: DatacenterMockService }
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SetProviderComponent);
        component = fixture.componentInstance;

        dcService = fixture.debugElement.injector.get(DatacenterService);
    });

    it('should create the set-provider cmp', () => {
        expect(component).toBeTruthy();
    });

    it('should get datacenter and provider from redux', () => {
        setMockNgRedux('digitalocean');
        completeRedux();

        fixture.detectChanges();

        component.provider$.subscribe(
           selectedProvider => expect(selectedProvider).toBe('digitalocean'),
        );
    });

    it('should get datacenter list', fakeAsync(() => {
        const datacenters = datacentersFake;
        const provider = 'digitalocean';

        setMockNgRedux(provider);
        completeRedux();

        fixture.detectChanges();
        tick();

        expect(component.datacenters[provider]).toEqual([datacenters[0], datacenters[1]]);
    }));

    it('should call nextStep if provider is alone', fakeAsync(() => {
        const spyNextStep = spyOn(WizardActions, 'nextStep');

        component.supportedNodeProviders = ['provider'];
        setMockNgRedux('digitalocean');
        completeRedux();

        fixture.detectChanges();
        tick();

        expect(spyNextStep.and.callThrough()).toHaveBeenCalledTimes(1);
    }));
});
