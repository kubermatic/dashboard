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
import {LabelFormComponent} from './component';

describe('LabelFormComponent', () => {
  let fixture: ComponentFixture<LabelFormComponent>;
  let component: LabelFormComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LabelFormComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize labels object', () => {
    expect(component.labels).toBeUndefined();

    component.ngOnInit();

    expect(component.labels).not.toBeUndefined();
  });

  it('should delete labels with nullify', () => {
    expect(component.labels).toBeUndefined();

    component.labels = {
      env: 'test',
    };
    component.ngOnInit();
    component.ngOnChanges(null);
    component.deleteLabel(0);

    expect(component.labels).toEqual({env: null});
  });

  it('should delete labels without nullify', () => {
    expect(component.labels).toBeUndefined();

    component.labels = {
      env: 'test',
    };
    component.ngOnInit();
    component.ngOnChanges(null);
    component.initialLabels = {};
    component.deleteLabel(0);

    expect(component.labels).toEqual({});
  });
});
