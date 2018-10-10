import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DigitaloceanAddNodeComponent } from './digitalocean-add-node.component';
import { asyncData } from '../../testing/services/api-mock.service';
import { ApiService } from '../../core/services';
import { fakeDigitaloceanSizes } from '../../testing/fake-data/addNodeModal.fake';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { fakeDigitaloceanCluster } from '../../testing/fake-data/cluster.fake';
import Spy = jasmine.Spy;
import {nodeDataFake} from '../../testing/fake-data/node.fake';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule
];

describe('DigitaloceanAddNodeComponent', () => {
  let fixture: ComponentFixture<DigitaloceanAddNodeComponent>;
  let component: DigitaloceanAddNodeComponent;
  let getDigitaloceanSizesForWizardSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getDigitaloceanSizesForWizard']);
    getDigitaloceanSizesForWizardSpy = apiMock.getDigitaloceanSizesForWizard.and.returnValue(asyncData(fakeDigitaloceanSizes()));
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        DigitaloceanAddNodeComponent,
      ],
      providers: [
        AddNodeService,
        { provide: ApiService, useValue: apiMock }
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitaloceanAddNodeComponent);
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
