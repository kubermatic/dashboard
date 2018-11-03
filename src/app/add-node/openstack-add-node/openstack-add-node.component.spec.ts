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
import { OpenstackAddNodeComponent } from './openstack-add-node.component';

describe('OpenstackAddNodeComponent', () => {
  let fixture: ComponentFixture<OpenstackAddNodeComponent>;
  let component: OpenstackAddNodeComponent;

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
