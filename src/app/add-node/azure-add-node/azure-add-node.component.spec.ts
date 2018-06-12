import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { fakeAzureCluster } from '../../testing/fake-data/cluster.fake';
import { AzureAddNodeComponent } from './azure-add-node.component';
import { nodeDataFake } from '../../testing/fake-data/node.fake';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule
];

describe('AzureAddNodeComponent', () => {
  let fixture: ComponentFixture<AzureAddNodeComponent>;
  let component: AzureAddNodeComponent;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        AzureAddNodeComponent,
      ],
      providers: [
        AddNodeService,
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AzureAddNodeComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeAzureCluster.spec.cloud;
    component.nodeData = nodeDataFake;
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });
});
