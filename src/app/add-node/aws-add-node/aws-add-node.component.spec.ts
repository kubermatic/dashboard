import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WizardService } from '../../core/services';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { SharedModule } from '../../shared/shared.module';
import { fakeAWSCluster } from '../../testing/fake-data/cluster.fake';
import { nodeDataFake } from '../../testing/fake-data/node.fake';
import { AwsAddNodeComponent } from './aws-add-node.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule
];

describe('AwsAddNodeComponent', () => {
  let fixture: ComponentFixture<AwsAddNodeComponent>;
  let component: AwsAddNodeComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        AwsAddNodeComponent,
      ],
      providers: [
        AddNodeService,
        WizardService,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AwsAddNodeComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeAWSCluster().spec.cloud;
    component.nodeData = nodeDataFake();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });

  it('form valid when initializing since aws has sane defaults for required fields', () => {
    fixture.detectChanges();
    expect(component.awsNodeForm.valid).toBeTruthy();
  });
});
