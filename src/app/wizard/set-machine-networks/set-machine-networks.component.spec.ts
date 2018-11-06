import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WizardService } from '../../core/services';
import { MachineNetworksModule } from '../../machine-networks/machine-networks.module';
import { SharedModule } from '../../shared/shared.module';
import { SetMachineNetworksComponent } from './set-machine-networks.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  ReactiveFormsModule,
  SharedModule,
  MachineNetworksModule,
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
        SetMachineNetworksComponent,
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
          gateway: '',
        }],
      },

    };
    fixture.detectChanges();
  });

  it('should create the Set Machine Networks cmp', () => {
    expect(component).toBeTruthy();
  });
});
