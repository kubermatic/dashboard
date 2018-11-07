import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { WizardService } from '../../core/services/wizard/wizard.service';
import { SharedModule } from '../../shared/shared.module';
import { fakeVSphereCluster } from '../../testing/fake-data/cluster.fake';
import { nodeDataFake } from '../../testing/fake-data/node.fake';
import { VSphereAddNodeComponent } from './vsphere-add-node.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
];

describe('VSphereAddNodeComponent', () => {
  let fixture: ComponentFixture<VSphereAddNodeComponent>;
  let component: VSphereAddNodeComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        VSphereAddNodeComponent,
      ],
      providers: [
        AddNodeService,
        WizardService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VSphereAddNodeComponent);
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
