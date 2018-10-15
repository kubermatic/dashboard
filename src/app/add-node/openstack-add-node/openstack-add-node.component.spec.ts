import { SharedModule } from '../../shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { OpenstackAddNodeComponent } from './openstack-add-node.component';
import { fakeOpenstackCluster } from '../../testing/fake-data/cluster.fake';
import { AddNodeService } from '../../core/services/add-node/add-node.service';
import { fakeOpenstackFlavors } from '../../testing/fake-data/addNodeModal.fake';
import { asyncData } from '../../testing/services/api-mock.service';
import { ApiService } from '../../core/services';
import Spy = jasmine.Spy;
import { nodeDataFake } from '../../testing/fake-data/node.fake';

describe('OpenstackAddNodeComponent', () => {
  let fixture: ComponentFixture<OpenstackAddNodeComponent>;
  let component: OpenstackAddNodeComponent;
  let getOpenStackFlavorsForWizardSpy: Spy;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getOpenStackFlavorsForWizard']);
    getOpenStackFlavorsForWizardSpy = apiMock.getOpenStackFlavorsForWizard.and.returnValue(asyncData(fakeOpenstackFlavors()));

    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SharedModule,
        ReactiveFormsModule
      ],
      declarations: [
        OpenstackAddNodeComponent,
      ],
      providers: [
        AddNodeService,
        { provide: ApiService, useValue: apiMock },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OpenstackAddNodeComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeOpenstackCluster().spec.cloud;
    component.nodeData = nodeDataFake();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });
});
