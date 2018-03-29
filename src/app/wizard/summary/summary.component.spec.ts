import { Observable } from 'rxjs/Observable';
import { DataCenterEntity } from './../../shared/entity/DatacenterEntity';
import { datacentersFake } from './../../testing/fake-data/datacenter.fake';
import { SSHKeysFake } from './../../testing/fake-data/sshkey.fake';
import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { MockNgRedux, NgReduxTestingModule } from '@angular-redux/store/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { SummaryComponent } from './summary.component';
import { CreateClusterModel } from '../../shared/model/CreateClusterModel';
import { ApiMockService } from '../../testing/services/api-mock.service';
import { clusterModelFake } from '../../testing/fake-data/cluster.fake';
import { NodeEntity } from '../../shared/entity/NodeEntity';
import { ApiService } from '../../core/services';
import { nodeCreateFake } from '../../testing/fake-data/node.fake';

const modules: any[] = [
  BrowserModule,
  NgReduxTestingModule,
  BrowserAnimationsModule,
  SharedModule
];

function setMockNgRedux(provider: string, datacenter: DataCenterEntity, nodeModel: NodeEntity, clusterModel: CreateClusterModel, nodeCount: number): void {
  const providerStub = MockNgRedux.getSelectorStub(['wizard', 'setProviderForm', 'provider']);
  providerStub.next(provider);

  const datacenterStub = MockNgRedux.getSelectorStub(['wizard', 'setDatacenterForm', 'datacenter']);
  datacenterStub.next(datacenter);

  const nodeModelStub = MockNgRedux.getSelectorStub(['wizard', 'nodeModel']);
  nodeModelStub.next(nodeModel);

  const clusterModelStub = MockNgRedux.getSelectorStub(['wizard', 'clusterModel']);
  clusterModelStub.next(clusterModel);

  const nodeCountStub = MockNgRedux.getSelectorStub(['wizard', 'nodeForm', 'node_count']);
  nodeCountStub.next(nodeCount);
}

function completeRedux() {
  const providerStub = MockNgRedux.getSelectorStub(['wizard', 'setProviderForm', 'provider']);
  providerStub.complete();

  const datacenterStub = MockNgRedux.getSelectorStub(['wizard', 'setDatacenterForm', 'datacenter']);
  datacenterStub.complete();

  const nodeModelStub = MockNgRedux.getSelectorStub(['wizard', 'nodeModel']);
  nodeModelStub.complete();

  const clusterModelStub = MockNgRedux.getSelectorStub(['wizard', 'clusterModel']);
  clusterModelStub.complete();

  const nodeCountStub = MockNgRedux.getSelectorStub(['wizard', 'nodeForm', 'node_count']);
  nodeCountStub.complete();
}

describe('SummaryComponent', () => {
  let fixture: ComponentFixture<SummaryComponent>;
  let component: SummaryComponent;

  beforeEach(async(() => {
    MockNgRedux.reset();
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        SummaryComponent
      ],
      providers: [
        { provide: ApiService, useClass: ApiMockService }
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryComponent);
    component = fixture.componentInstance;
  });

  it('should create the set-settings cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should get data from redux', fakeAsync(() => {
    setMockNgRedux('digitalocean', datacentersFake[0], nodeCreateFake, clusterModelFake, 3);
    completeRedux();
    fixture.detectChanges();
    tick();

    expect(component.provider).toBe('digitalocean', 'should get provider');
    expect(component.region).toEqual(datacentersFake[0], 'should get datacenter');
    expect(component.nodeModel).toEqual(nodeCreateFake, 'should get node model');
    expect(component.clusterModel).toEqual(clusterModelFake, 'should get cluster model');
    expect(component.nodeCount).toBe(3, 'should get node count');
  }));

  it('should call get sshkeys method', fakeAsync(() => {
    const apiService = fixture.debugElement.injector.get(ApiService);
    const spyGetSSHKeys = spyOn(apiService, 'getSSHKeys').and.returnValue(Observable.of(SSHKeysFake));

    setMockNgRedux('digitalocean', datacentersFake[0], nodeCreateFake, clusterModelFake, 3);
    completeRedux();

    fixture.detectChanges();
    tick();

    expect(spyGetSSHKeys.and.callThrough()).toHaveBeenCalledTimes(1);
  }));
});

