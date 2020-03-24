import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {FormArray} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterTestingModule} from '@angular/router/testing';
import {WizardService} from '../../../wizard-new/service/wizard';
import {SharedModule} from '../../shared.module';
import {MachineNetworkComponent} from './component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  RouterTestingModule,
  SharedModule,
];

describe('MachineNetworksComponent', () => {
  let component: MachineNetworkComponent;
  let fixture: ComponentFixture<MachineNetworkComponent>;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [MachineNetworkComponent],
          providers: [
            WizardService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineNetworkComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create the machine network component', () => {
    expect(component).toBeTruthy();
  });

  it('expecting form to be valid', () => {
    const machineNetworks = component.form.get('machineNetworks') as FormArray;
    machineNetworks.controls[0].setValue({cidr: '192.182.0.0/29', dnsServers: ['8.8.8.8'], gateway: '192.180.0.2'});
    expect(machineNetworks.controls[0].valid).toBeTruthy();
  });

  it('expecting form to be invalid', () => {
    const machineNetworks = component.form.get('machineNetworks') as FormArray;
    machineNetworks.controls[0].setValue({cidr: '192.182.0.0', dnsServers: ['8.8.8.8'], gateway: '192.180.0.2'});
    expect(machineNetworks.controls[0].valid).toBeFalsy();
  });
});
