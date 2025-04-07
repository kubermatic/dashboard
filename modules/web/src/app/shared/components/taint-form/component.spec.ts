// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

import {SharedModule} from '@shared/module';
import {Taint} from '../../entity/node';

import {TaintFormComponent} from './component';

describe('TaintFormComponent', () => {
  let fixture: ComponentFixture<TaintFormComponent>;
  let component: TaintFormComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaintFormComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize taints object', () => {
    expect(component.taints).toBeUndefined();

    component.ngOnInit();

    expect(component.taints).not.toBeUndefined();
  });

  it('should delete labels', () => {
    expect(component.taints).toBeUndefined();

    component.taints = [{key: 'key', value: 'value', effect: Taint.NO_SCHEDULE}];
    component.ngOnInit();
    component.deleteTaint(0);

    expect(component.taints).toEqual([]);
  });
});
