import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { WizardService } from '../../core/services/wizard/wizard.service';
import { SharedModule } from '../../shared/shared.module';
import { fakeVSphereCluster } from '../../testing/fake-data/cluster.fake';
import { nodeDataFake } from '../../testing/fake-data/node.fake';
import { VSphereNodeDataComponent } from './vsphere-node-data.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
];

describe('VSphereNodeDataComponent', () => {
  let fixture: ComponentFixture<VSphereNodeDataComponent>;
  let component: VSphereNodeDataComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        VSphereNodeDataComponent,
      ],
      providers: [
        AddNodeService,
        WizardService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VSphereNodeDataComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeVSphereCluster().spec.cloud;
    component.nodeData = nodeDataFake();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });

  it('form valid when initializing since vsphere has sane defaults for required fields', () => {
    fixture.detectChanges();
    expect(component.vsphereNodeForm.valid).toBeTruthy();
  });
});
