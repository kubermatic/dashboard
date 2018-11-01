import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgReduxTestingModule } from '@angular-redux/store/lib/testing/ng-redux-testing.module';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { WizardService } from '../core/services';
import { SharedModule } from '../shared/shared.module';
import { fakeClusterWithMachineNetwork } from '../testing/fake-data/clusterWithMachineNetworks.fake';
import { RouterTestingModule } from '../testing/router-stubs';
import { MachineNetworksComponent } from './machine-networks.component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  NgReduxTestingModule,
  SharedModule
];

describe('MachineNetworksComponent', () => {
  let component: MachineNetworksComponent;
  let fixture: ComponentFixture<MachineNetworksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [MachineNetworksComponent],
      providers: [
        WizardService,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineNetworksComponent);
    component = fixture.componentInstance;
    component.cluster = fakeClusterWithMachineNetwork();
    component.width = 100;
    component.isWizard = false;

    fixture.detectChanges();
  });

  it('should create the machine network component', () => {
    expect(component).toBeTruthy();
  });

  it('expecting form to be valid', () => {
    const machineNetworks = <FormArray> component.machineNetworksForm.get('machineNetworks');
    machineNetworks.controls[0].setValue({cidr: '192.182.0.0/29', dnsServers: ['8.8.8.8'], gateway: '192.180.0.2'});
    expect(machineNetworks.controls[0].valid).toBeTruthy();
  });

  it('expecting form to be invalid', () => {
    const machineNetworks = <FormArray> component.machineNetworksForm.get('machineNetworks');
    machineNetworks.controls[0].setValue({cidr: '192.182.0.0', dnsServers: ['8.8.8.8'], gateway: '192.180.0.2'});
    expect(machineNetworks.controls[0].valid).toBeFalsy();
  });
});
