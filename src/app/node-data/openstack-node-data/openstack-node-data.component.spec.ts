import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ApiService } from '../../core/services';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { SharedModule } from '../../shared/shared.module';
import { fakeOpenstackFlavors } from '../../testing/fake-data/addNodeModal.fake';
import { fakeOpenstackCluster } from '../../testing/fake-data/cluster.fake';
import { nodeDataFake } from '../../testing/fake-data/node.fake';
import { asyncData } from '../../testing/services/api-mock.service';
import { OpenstackNodeDataComponent } from './openstack-node-data.component';

describe('OpenstackNodeDataComponent', () => {
  let fixture: ComponentFixture<OpenstackNodeDataComponent>;
  let component: OpenstackNodeDataComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getOpenStackFlavorsForWizard']);
    apiMock.getOpenStackFlavorsForWizard.and.returnValue(asyncData(fakeOpenstackFlavors()));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SharedModule,
        ReactiveFormsModule,
      ],
      declarations: [
        OpenstackNodeDataComponent,
      ],
      providers: [
        AddNodeService,
        { provide: ApiService, useValue: apiMock },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenstackNodeDataComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeOpenstackCluster().spec.cloud;
    component.nodeData = nodeDataFake();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });
});
