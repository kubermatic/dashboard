import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {ApiService, WizardService} from '../../core/services';
import {NodeDataService} from '../../core/services/node-data/node-data.service';
import {SharedModule} from '../../shared/shared.module';
import {fakeGCPCluster} from '../../testing/fake-data/cluster.fake';
import {nodeDataFake} from '../../testing/fake-data/node.fake';
import {ApiMockService} from '../../testing/services/api-mock.service';

import {GCPNodeDataComponent} from './gcp-node-data.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
  HttpClientModule,
];

describe('GCPNodeDataComponent', () => {
  let fixture: ComponentFixture<GCPNodeDataComponent>;
  let component: GCPNodeDataComponent;

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            GCPNodeDataComponent,
          ],
          providers: [
            NodeDataService,
            WizardService,
            {provide: ApiService, useValue: ApiMockService},
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GCPNodeDataComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeGCPCluster().spec.cloud;
    component.nodeData = nodeDataFake();
  });

  it('should init', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });
});
