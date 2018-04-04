import { SharedModule } from '../../../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { MockNgRedux, NgReduxTestingModule } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProviderNodeComponent } from './node.component';
import { AddNodeStubsModule } from '../../../../testing/components/add-node-stubs';

const modules: any[] = [
  BrowserModule,
  NgReduxTestingModule,
  BrowserAnimationsModule,
  SharedModule,
  AddNodeStubsModule
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
      ],
      providers: [],
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
