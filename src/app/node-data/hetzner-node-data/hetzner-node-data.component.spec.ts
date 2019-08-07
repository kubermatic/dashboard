import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ApiService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {SharedModule} from '../../shared/shared.module';
import {fakeHetznerTypes} from '../../testing/fake-data/addNodeModal.fake';
import {fakeHetznerCluster} from '../../testing/fake-data/cluster.fake';
import {nodeDataFake} from '../../testing/fake-data/node.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {HetznerNodeDataComponent} from './hetzner-node-data.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
  HttpClientModule,
];

describe('HetznerNodeDataComponent', () => {
  let fixture: ComponentFixture<HetznerNodeDataComponent>;
  let component: HetznerNodeDataComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getHetznerTypes']);
    apiMock.getHetznerTypes.and.returnValue(asyncData(fakeHetznerTypes()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            HetznerNodeDataComponent,
          ],
          providers: [
            WizardService,
            NodeDataService,
            {provide: ApiService, useValue: apiMock},
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HetznerNodeDataComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeHetznerCluster().spec.cloud;
    component.nodeData = nodeDataFake();
    fixture.detectChanges();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid when initializing', () => {
    expect(component.hetznerNodeForm.valid).toBeFalsy();
  });
});
