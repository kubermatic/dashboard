import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApiService } from '../../core/services';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { SharedModule } from '../../shared/shared.module';
import { fakeDigitaloceanSizes } from '../../testing/fake-data/addNodeModal.fake';
import { fakeDigitaloceanCluster } from '../../testing/fake-data/cluster.fake';
import { nodeDataFake } from '../../testing/fake-data/node.fake';
import { asyncData } from '../../testing/services/api-mock.service';
import { DigitaloceanNodeDataComponent } from './digitalocean-node-data.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
];

describe('DigitaloceanNodeDataComponent', () => {
  let fixture: ComponentFixture<DigitaloceanNodeDataComponent>;
  let component: DigitaloceanNodeDataComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getDigitaloceanSizesForWizard']);
    apiMock.getDigitaloceanSizesForWizard.and.returnValue(asyncData(fakeDigitaloceanSizes()));
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        DigitaloceanNodeDataComponent,
      ],
      providers: [
        AddNodeService,
        { provide: ApiService, useValue: apiMock },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitaloceanNodeDataComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeDigitaloceanCluster().spec.cloud;
    component.nodeData = nodeDataFake();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });

  it('form valid when initializing since digitalocean has sane defaults for required fields', () => {
    fixture.detectChanges();
    expect(component.doNodeForm.valid).toBeTruthy();
  });
});
