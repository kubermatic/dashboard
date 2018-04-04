import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AwsAddNodeComponent } from './aws-add-node.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { fakeAWSCluster } from '../../testing/fake-data/cluster.fake';

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
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AwsAddNodeComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeAWSCluster.spec.cloud;
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
