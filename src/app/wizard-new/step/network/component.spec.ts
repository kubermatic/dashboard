import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DatacenterService, PresetsService} from '../../../core/services';
import {NODE_DATA_CONFIG, NodeDataMode} from '../../../node-data-new/config';
import {NodeDataService} from '../../../node-data-new/service/service';
import {SharedModule} from '../../../shared/shared.module';
import {ClusterService} from '../../service/cluster';
import {WizardService} from '../../service/wizard';
import {MachineNetworkStepComponent} from './component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, ReactiveFormsModule, SharedModule, HttpClientModule];

describe('MachineNetworkStepComponent', () => {
  let fixture: ComponentFixture<MachineNetworkStepComponent>;
  let component: MachineNetworkStepComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [MachineNetworkStepComponent],
      providers: [
        WizardService,
        ClusterService,
        NodeDataService,
        ClusterService,
        {provide: NODE_DATA_CONFIG, useValue: NodeDataMode.Wizard},
        PresetsService,
        DatacenterService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MachineNetworkStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the Machine Network Step cmp', () => {
    expect(component).toBeTruthy();
  });
});
