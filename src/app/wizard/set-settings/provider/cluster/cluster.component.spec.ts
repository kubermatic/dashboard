import { OpenstackClusterStubComponent, BringyourownClusterStubComponent, AWSClusterStubComponent, DigitaloceanClusterStubComponent } from './../../../../testing/components/wizard-stubs';
import { ProviderClusterComponent } from './cluster.component';
import { SharedModule } from '../../../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';

import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';
import { AddNodeStubComponent } from '../../../../testing/components/add-node-stubs';

const modules: any[] = [
    BrowserModule,
    NgReduxTestingModule,
    BrowserAnimationsModule,
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
                ProviderClusterComponent,
                OpenstackClusterStubComponent,
                BringyourownClusterStubComponent,
                AWSClusterStubComponent,
                DigitaloceanClusterStubComponent
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

        expect(component.provider).toBe('provider');
    });
});
