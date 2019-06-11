import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ApiService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {SharedModule} from '../../shared/shared.module';
import {fakeDigitaloceanSizes} from '../../testing/fake-data/addNodeModal.fake';
import {fakeDigitaloceanCluster} from '../../testing/fake-data/cluster.fake';
import {nodeDataFake} from '../../testing/fake-data/node.fake';
import {asyncData} from '../../testing/services/api-mock.service';
import {DigitaloceanNodeDataComponent} from './digitalocean-node-data.component';

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
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            DigitaloceanNodeDataComponent,
          ],
          providers: [
            NodeDataService,
            WizardService,
            {provide: ApiService, useValue: apiMock},
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitaloceanNodeDataComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeDigitaloceanCluster().spec.cloud;
    component.nodeData = nodeDataFake();
    fixture.detectChanges();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
  });

  it('form invalid when initializing', () => {
    expect(component.doNodeForm.valid).toBeFalsy();
  });
});
