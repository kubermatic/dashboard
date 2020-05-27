import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {WizardService} from '../../core/services';
import {MachineNetworksModule} from '../../machine-networks/machine-networks.module';
import {SharedModule} from '../../shared/shared.module';
import {nodeDataFake} from '../../testing/fake-data/node.fake';
import {SetMachineNetworksComponent} from './set-machine-networks.component';
import {ClusterType} from '../../shared/entity/ClusterEntity';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  ReactiveFormsModule,
  SharedModule,
  MachineNetworksModule,
  HttpClientModule,
];

describe('SetMachineNetworksComponent', () => {
  let fixture: ComponentFixture<SetMachineNetworksComponent>;
  let component: SetMachineNetworksComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [SetMachineNetworksComponent],
      providers: [WizardService],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetMachineNetworksComponent);
    component = fixture.componentInstance;
    component.cluster = {
      name: '',
      spec: {
        version: '',
        cloud: {
          dc: '',
        },
        machineNetworks: [
          {
            cidr: '',
            dnsServers: [],
            gateway: '',
          },
        ],
      },
      type: ClusterType.Empty,
    };
    component.nodeData = nodeDataFake();
    fixture.detectChanges();
  });

  it('should create the Set Machine Networks cmp', () => {
    expect(component).toBeTruthy();
  });
});
