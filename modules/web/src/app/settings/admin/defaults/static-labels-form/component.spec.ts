// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
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

import {SimpleChange} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {StaticLabel} from '@app/shared/entity/settings';
import {CoreModule} from '@core/module';
import {SharedModule} from '@shared/module';
import {StaticLabelsFormComponent} from './component';

const LABELS: StaticLabel[] = [
  {key: 'env', values: ['prod', 'dev'], default: true, protected: false},
  {key: 'team', values: ['web'], default: true, protected: true},
];

const INITIAL_LABELS_COUNT = 2;
const EMPTY_ROW_COUNT = 1;
const FILLED_ROW_COUNT = 1;

describe('StaticLabelsFormComponent', () => {
  let fixture: ComponentFixture<StaticLabelsFormComponent>;
  let component: StaticLabelsFormComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
      declarations: [StaticLabelsFormComponent],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StaticLabelsFormComponent);
    component = fixture.componentInstance;
    component.asyncLabelValidators = [];
  });

  function seed(labels: StaticLabel[]): void {
    component.staticLabels = labels;
    component.ngOnChanges({staticLabels: new SimpleChange(undefined, labels, true)});
  }

  function rowKeys(): string[] {
    return component.staticLabelArray.controls.map(row => row.get('key').value);
  }

  it('should render one empty row when there are no initial labels', () => {
    seed([]);

    expect(component.staticLabelArray.length).toBe(1);
    expect(rowKeys()).toEqual(['']);
  });

  it('should render the initial labels followed by exactly one empty row', () => {
    seed(LABELS);

    expect(component.staticLabelArray.length).toBe(INITIAL_LABELS_COUNT + EMPTY_ROW_COUNT);
    expect(rowKeys()).toEqual(['env', 'team', '']);
  });

  it('should append an empty row once the last row has a key and values', () => {
    seed([]);
    const lastRow = component.staticLabelArray.at(0);

    lastRow.get('key').setValue('env');
    expect(component.staticLabelArray.length).toBe(1);
    expect(rowKeys()).toEqual(['env']);

    lastRow.get('values').setValue(['prod']);
    expect(component.staticLabelArray.length).toBe(FILLED_ROW_COUNT + EMPTY_ROW_COUNT);
    expect(rowKeys()).toEqual(['env', '']);
  });

  it('should emit the initial labels without the empty trailing row', () => {
    const emitSpy = jest.spyOn(component.staticLabelsChange, 'emit');

    seed(LABELS);

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(LABELS);
  });

  it('should not re-seed rows when the input is re-assigned by the parent', () => {
    seed(LABELS);

    component.staticLabels = [...LABELS];
    component.ngOnChanges({staticLabels: new SimpleChange(LABELS, component.staticLabels, false)});

    expect(component.staticLabelArray.length).toBe(INITIAL_LABELS_COUNT + EMPTY_ROW_COUNT);
    expect(rowKeys()).toEqual(['env', 'team', '']);
  });
});
