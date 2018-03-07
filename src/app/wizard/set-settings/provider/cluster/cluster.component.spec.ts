import { WizardStubsModule } from './../../../../testing/components/wizard-stubs';
import { ProviderClusterComponent } from './cluster.component';
import { SharedModule } from '../../../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { TestBed, async, ComponentFixture } from '@angular/core/testing';

const modules: any[] = [
    BrowserModule,
    NgReduxTestingModule,
    BrowserAnimationsModule,
    SharedModule,
    WizardStubsModule
];

function setMockNgRedux(provider: string): void {
    const providerStub = MockNgRedux.getSelectorStub(['wizard', 'setProviderForm', 'provider']);
    providerStub.next(provider);
}

function completeRedux() {
    const providerStub = MockNgRedux.getSelectorStub(['wizard', 'setProviderForm', 'provider']);
    providerStub.complete();
}

describe('ProviderClusterComponent', () => {
    let fixture: ComponentFixture<ProviderClusterComponent>;
    let component: ProviderClusterComponent;

    beforeEach(async(() => {
        MockNgRedux.reset();
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                ProviderClusterComponent
            ],
            providers: [
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProviderClusterComponent);
        component = fixture.componentInstance;
    });

    it('should create the provider cluster cmp', () => {
        expect(component).toBeTruthy();
    });

    it('should get provider name from redux', () => {
        setMockNgRedux('provider');
        completeRedux();

        fixture.detectChanges();

      component.provider$.subscribe(
        provider => expect(provider).toBe('provider'),
      );
    });
});
