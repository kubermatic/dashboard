import { SharedModule } from '../../../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';

import { MockNgRedux, NgReduxTestingModule } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProviderNodeComponent } from './node.component';
import { AddNodeStubsModule } from '../../../../testing/components/add-node-stubs';
import { CloudSpec } from '../../../../shared/entity/ClusterEntity';

const modules: any[] = [

  BrowserModule,
  NgReduxTestingModule,
  BrowserAnimationsModule,
  SharedModule,
  AddNodeStubsModule
];


function setMockNgRedux(provider: string, token: string, cloudSpec: CloudSpec): void {

  const providerStub = MockNgRedux.getSelectorStub(['wizard', 'setProviderForm', 'provider']);
  providerStub.next(provider);


  const tokenStub = MockNgRedux.getSelectorStub(['wizard', 'digitalOceanClusterForm', 'access_token']);
  tokenStub.next(token);

    const cloudSpecStub = MockNgRedux.getSelectorStub(['wizard', 'cloudSpec']);
    tokenStub.next(cloudSpec);
}

function completeRedux() {

  const providerStub = MockNgRedux.getSelectorStub(['wizard', 'setProviderForm', 'provider']);
  providerStub.complete();


  const tokenStub = MockNgRedux.getSelectorStub(['wizard', 'digitalOceanClusterForm', 'access_token']);
  tokenStub.complete();

    const cloudSpecStub = MockNgRedux.getSelectorStub(['wizard', 'cloudSpec']);
    cloudSpecStub.complete();
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
    const cloudSpec: CloudSpec = {
      dc: 'openstack-dc',
      openstack: {
        username: '',
        password: '',
        tenant: '',
        domain: '',
        network: '',
        securityGroups: '',
        floatingIpPool: ''
      },
      aws: null,
      bringyourown: null,
      digitalocean: null,
      baremetal: null
    };
    setMockNgRedux('provider', 'token', cloudSpec);
    completeRedux();
    fixture.detectChanges();


    component.providerName$.subscribe(
      providerName => expect(providerName).toBe('provider'),
    );
    component.cloudSpec$.subscribe(
      cloudSpecRes => expect(cloudSpecRes).toEqual(cloudSpec),
    );
  });
});
