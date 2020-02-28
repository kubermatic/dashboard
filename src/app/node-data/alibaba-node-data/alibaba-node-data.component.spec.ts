import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {SharedModule} from '../../shared/shared.module';
import {fakeAlibabaCluster} from '../../testing/fake-data/cluster.fake';
import {nodeDataFake} from '../../testing/fake-data/node.fake';
import {AlibabaNodeDataComponent} from './alibaba-node-data.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
  HttpClientModule,
];

describe('AlibabaNodeDataComponent', () => {
  let fixture: ComponentFixture<AlibabaNodeDataComponent>;
  let component: AlibabaNodeDataComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            AlibabaNodeDataComponent,
          ],
          providers: [
            NodeDataService,
            WizardService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AlibabaNodeDataComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeAlibabaCluster().spec.cloud;
    component.nodeData = nodeDataFake();
    component.clusterId = '';
    component.cloudSpec.alibaba = {
      accessKeyID: '',
      accessKeySecret: '',
    };
    fixture.detectChanges();
  });

  it('should create the add node cmp', () => {
    expect(component).toBeTruthy();
  });
});
