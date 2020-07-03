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

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, ReactiveFormsModule, HttpClientModule];

describe('HetznerNodeDataComponent', () => {
  let fixture: ComponentFixture<HetznerNodeDataComponent>;
  let component: HetznerNodeDataComponent;

  beforeEach(async(() => {
    const apiMock = {getHetznerTypes: jest.fn()};
    apiMock.getHetznerTypes.mockReturnValue(asyncData(fakeHetznerTypes()));

    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [HetznerNodeDataComponent],
      providers: [WizardService, NodeDataService, {provide: ApiService, useValue: apiMock}],
    }).compileComponents();
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
    expect(component.form.valid).toBeFalsy();
  });
});
