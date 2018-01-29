import { SharedModule } from '../../../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgReduxTestingModule, MockNgRedux } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { By } from '@angular/platform-browser';
import { TestBed, async, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';

import { NgRedux } from '@angular-redux/store/lib/src/components/ng-redux';
import { ProviderNodeComponent } from './node.component';
import { AddNodeStubComponent } from '../../../../testing/components/add-node-stubs';

const modules: any[] = [
    BrowserModule,
    NgReduxTestingModule,
    BrowserAnimationsModule,
    SharedModule
];

function setMockNgRedux(provider: string, token: string): void {
    const providerStub = MockNgRedux.getSelectorStub(['wizard', 'setProviderForm', 'provider']);
    providerStub.next(provider);

    const tokenStub = MockNgRedux.getSelectorStub(['wizard', 'digitalOceanClusterForm', 'access_token']);
    tokenStub.next(token);
}

function completeRedux() {
    const providerStub = MockNgRedux.getSelectorStub(['wizard', 'setProviderForm', 'provider']);
    providerStub.complete();

    const tokenStub = MockNgRedux.getSelectorStub(['wizard', 'digitalOceanClusterForm', 'access_token']);
    tokenStub.complete();
}

describe('ProviderNodeComponent', () => {
    let fixture: ComponentFixture<ProviderNodeComponent>;
    let component: ProviderNodeComponent;

    beforeEach(async(() => {
        MockNgRedux.reset();
        TestBed.configureTestingModule({
            imports: [
                ...modules,
            ],
            declarations: [
                ProviderNodeComponent,
                AddNodeStubComponent
            ],
            providers: [
            ],
        }).compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ProviderNodeComponent);
        component = fixture.componentInstance;
    });

    it('should create the provider node cmp', () => {
        expect(component).toBeTruthy();
    });

    it('should get data form redux', () => {
        setMockNgRedux('provider', 'token');
        completeRedux();
        fixture.detectChanges();

        expect(component.provider.name).toBe('provider', 'should get provider');
        expect(component.provider.payload.token).toBe('token', 'should get token');
    });
});
