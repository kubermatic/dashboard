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
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatChipInputEvent} from '@angular/material/chips';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

import {KUBERNETES_RESOURCE_NAME_PATTERN} from '@shared/validators/others';
import {SharedModule} from '@shared/module';
import {ChipAutocompleteComponent} from './component';

function chipInputEvent(value: string): MatChipInputEvent {
  return {value, chipInput: {clear: jest.fn()}} as unknown as MatChipInputEvent;
}

// Mirrors how the vSphere cluster wizard step uses the component: inside a parent form, with a required
// control and the Kubernetes resource name pattern.
@Component({
  template: `
    <form [formGroup]="form">
      <km-chip-autocomplete
        formControlName="tags"
        label="Tags"
        [required]="true"
        [kmPattern]="pattern"
        [tags]="predefinedTags"
        (onChange)="changed = $event" />
    </form>
  `,
  standalone: false,
})
class HostComponent {
  @ViewChild(ChipAutocompleteComponent) chips: ChipAutocompleteComponent;
  readonly pattern = KUBERNETES_RESOURCE_NAME_PATTERN;
  predefinedTags: string[] = [];
  changed: string[] = [];
  form: FormGroup;

  constructor(builder: FormBuilder) {
    this.form = builder.group({tags: builder.control([])});
  }
}

describe('ChipAutocompleteComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, ReactiveFormsModule, SharedModule],
      declarations: [HostComponent],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be invalid without tags if required', () => {
    expect(host.form.valid).toBe(false);
  });

  it('should be valid with one tag', () => {
    host.chips.addTag(chipInputEvent('a'));
    fixture.detectChanges();

    expect(host.changed).toEqual(['a']);
    expect(host.form.valid).toBe(true);
  });

  it('should stay valid when a second tag is added', () => {
    host.chips.addTag(chipInputEvent('a'));
    host.chips.addTag(chipInputEvent('b'));
    fixture.detectChanges();

    expect(host.changed).toEqual(['a', 'b']);
    expect(host.form.get('tags').errors).toBeNull();
    expect(host.form.valid).toBe(true);
  });

  it('should be invalid for duplicate tags', () => {
    host.chips.addTag(chipInputEvent('a'));
    host.chips.addTag(chipInputEvent('a'));
    fixture.detectChanges();

    expect(host.form.valid).toBe(false);
    expect(host.form.get('tags').hasError('unique')).toBe(true);
  });

  it('should be invalid for tags that do not match the pattern', () => {
    host.chips.addTag(chipInputEvent('Not Valid'));
    fixture.detectChanges();

    expect(host.form.valid).toBe(false);
  });
});
