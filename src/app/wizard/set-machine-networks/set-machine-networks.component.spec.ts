import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { MachineNetworksModule } from '../../machine-networks/machine-networks.module';
import { SetMachineNetworksComponent } from './set-machine-networks.component';
import { WizardService } from '../../core/services';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  ReactiveFormsModule,
  SharedModule,
  MachineNetworksModule
];

describe('SetMachineNetworksComponent', () => {
  let fixture: ComponentFixture<SetMachineNetworksComponent>;
  let component: SetMachineNetworksComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        SetMachineNetworksComponent
      ],
      providers: [
        WizardService,
      ],
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
        machineNetworks: [{
          cidr: '',
          dnsServers: [],
          gateway: ''
        }]
      },

    };
    fixture.detectChanges();
  });

  it('should create the Set Machine Networks cmp', () => {
    expect(component).toBeTruthy();
  });
});
