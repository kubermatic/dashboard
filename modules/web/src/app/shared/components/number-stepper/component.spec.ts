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

import {Component, ViewChild} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {SharedModule} from '@shared/module';
import {NumberStepperComponent} from './component';

const STATIC_MIN_ATTRIBUTE = 2;
const STATIC_MAX_ATTRIBUTE = 10;

@Component({
  template: `<km-number-stepper
    label="Replicas"
    min="${STATIC_MIN_ATTRIBUTE}"
    max="${STATIC_MAX_ATTRIBUTE}"></km-number-stepper>`,
  standalone: false,
})
class StaticAttributeHostComponent {
  @ViewChild(NumberStepperComponent) stepper: NumberStepperComponent;
}

describe('NumberStepperComponent', () => {
  let fixture: ComponentFixture<StaticAttributeHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SharedModule],
      declarations: [StaticAttributeHostComponent],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StaticAttributeHostComponent);
    fixture.detectChanges();
  });

  it('should initialize', waitForAsync(() => {
    expect(fixture.componentInstance.stepper).toBeTruthy();
  }));

  // Angular 22 drops support for string min/max in MinValidator/MaxValidator. Static attribute
  // bindings must therefore arrive as numbers, not as the strings the template declares.
  it('should coerce static min/max attributes to numbers', waitForAsync(() => {
    const stepper = fixture.componentInstance.stepper;

    expect(stepper.min).toBe(STATIC_MIN_ATTRIBUTE);
    expect(stepper.max).toBe(STATIC_MAX_ATTRIBUTE);
    expect(typeof stepper.min).toBe('number');
    expect(typeof stepper.max).toBe('number');
  }));
});
