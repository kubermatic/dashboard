import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ApiService} from '../../core/services';
import {SharedModule} from '../../shared/shared.module';
import {fakeClusterWithMachineNetwork} from '../../testing/fake-data/clusterWithMachineNetworks.fake';
import {nodeDataCentOsFake, nodeDataContainerLinuxFake, nodeDataFake} from '../../testing/fake-data/node.fake';
import {ApiMockService} from '../../testing/services/api-mock.service';
import {SummaryComponent} from './summary.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
];

describe('SummaryComponent', () => {
  let fixture: ComponentFixture<SummaryComponent>;
  let component: SummaryComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            SummaryComponent,
          ],
          providers: [
            {provide: ApiService, useClass: ApiMockService},
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryComponent);
    component = fixture.componentInstance;
  });

  it('should create summary cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should get correct operating system', () => {
    component.nodeData = nodeDataFake();
    expect(component.getOperatingSystem()).toBe('Ubuntu');

    component.nodeData = nodeDataCentOsFake();
    expect(component.getOperatingSystem()).toBe('CentOS');

    component.nodeData = nodeDataContainerLinuxFake();
    expect(component.getOperatingSystem()).toBe('Container Linux');
  });

  it('should validate if tags should be displayed', () => {
    const tags = ['kubermatic', 'kubermatic-cluster-tr9bczz84t'];
    expect(component.displayTags(tags)).toBeTruthy();

    const noTags = [];
    expect(component.displayTags(noTags)).toBeFalsy();
  });

  it('should concat Tags from object', () => {
    const tags = {key: 'kubermatic', anotherKey: 'kubermatic-cluster-tr9bczz84t'};
    expect(component.getTagsFromObject(tags)).toBe('key: kubermatic, anotherKey: kubermatic-cluster-tr9bczz84t');
  });

  it('should concat DNS Servers', () => {
    const dnsServers = fakeClusterWithMachineNetwork().spec.machineNetworks[0].dnsServers;
    expect(component.getDnsServers(dnsServers)).toBe('8.8.8.8, 8.8.1.1');
  });

  it('should return true if there are no IPs left', () => {
    expect(component.noIpsLeft(fakeClusterWithMachineNetwork(), 3)).toBeFalsy();
    expect(component.noIpsLeft(fakeClusterWithMachineNetwork(), 10)).toBeTruthy();
  });
});
