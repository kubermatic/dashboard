import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ReactiveFormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {ApiService, WizardService} from '../../../core/services';
import {NodeDataService} from '../../../core/services/node-data/node-data.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeGCPCluster} from '../../../testing/fake-data/cluster.fake';
import {nodeDataFake} from '../../../testing/fake-data/node.fake';
import {ApiMockService} from '../../../testing/services/api-mock.service';

import {GCPNodeOptionsComponent} from './gcp-node-options.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
  ReactiveFormsModule,
  HttpClientModule,
];

describe('GCPNodeOptionsComponent', () => {
  let fixture: ComponentFixture<GCPNodeOptionsComponent>;
  let component: GCPNodeOptionsComponent;

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            GCPNodeOptionsComponent,
          ],
          providers: [
            {provide: ApiService, useClass: ApiMockService},
            NodeDataService,
            WizardService,
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GCPNodeOptionsComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeGCPCluster().spec.cloud;
    component.nodeData = nodeDataFake();
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });
});
