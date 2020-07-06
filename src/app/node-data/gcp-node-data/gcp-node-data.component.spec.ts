// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, ReactiveFormsModule, HttpClientModule];

describe('GCPNodeDataComponent', () => {
  let fixture: ComponentFixture<GCPNodeDataComponent>;
  let component: GCPNodeDataComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [GCPNodeDataComponent],
      providers: [{provide: ApiService, useClass: ApiMockService}, NodeDataService, WizardService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GCPNodeDataComponent);
    component = fixture.componentInstance;
    component.cloudSpec = fakeGCPCluster().spec.cloud;
    component.nodeData = nodeDataFake();
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
  });
});
