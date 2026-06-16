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
import {MatChipInputEvent} from '@angular/material/chips';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';

import {SharedModule} from '@shared/module';
import {ChipListComponent} from './component';

const TAGS_CONTROL = 'tags';

function chipInputEvent(value: string): MatChipInputEvent {
  return {value, chipInput: {clear: jest.fn()}} as unknown as MatChipInputEvent;
}

describe('ChipListComponent', () => {
  let fixture: ComponentFixture<ChipListComponent>;
  let component: ChipListComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChipListComponent);
    component = fixture.componentInstance;
    component.tags = [];
    fixture.detectChanges(); // triggers ngOnInit -> builds the form
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  describe('addTag', () => {
    it('should add a single trimmed tag and emit it', () => {
      const spy = jest.spyOn(component.onChange, 'emit');

      component.addTag(chipInputEvent('prod'));

      expect(component.tags).toEqual(['prod']);
      expect(spy).toHaveBeenCalledWith(['prod']);
    });

    it('should split multiple values separated by comma or space', () => {
      component.addTag(chipInputEvent('a, b c'));

      expect(component.tags).toEqual(['a', 'b', 'c']);
    });

    it('should ignore empty or whitespace-only input', () => {
      const spy = jest.spyOn(component.onChange, 'emit');

      component.addTag(chipInputEvent('   '));

      expect(component.tags).toEqual([]);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('removeTag', () => {
    it('should remove an existing tag and emit the remainder', () => {
      component.tags = ['a', 'b'];
      const spy = jest.spyOn(component.onChange, 'emit');

      component.removeTag('a');

      expect(component.tags).toEqual(['b']);
      expect(spy).toHaveBeenCalledWith(['b']);
    });

    it('should leave tags unchanged when the tag is absent', () => {
      component.tags = ['a'];

      component.removeTag('missing');

      expect(component.tags).toEqual(['a']);
    });
  });

  describe('writeValue', () => {
    it('should set the form control and tags for a non-empty array', () => {
      component.writeValue(['x', 'y']);

      expect(component.tags).toEqual(['x', 'y']);
      expect(component.form.get(TAGS_CONTROL).value).toEqual(['x', 'y']);
    });

    it('should ignore an empty array and keep the current value', () => {
      component.form.get(TAGS_CONTROL).setValue(['keep']);

      component.writeValue([]);

      expect(component.form.get(TAGS_CONTROL).value).toEqual(['keep']);
    });
  });

  describe('registerOnChange', () => {
    it('should propagate the raw tags array, not the wrapped group value', () => {
      const fn = jest.fn();
      component.registerOnChange(fn);

      component.form.get(TAGS_CONTROL).setValue(['a', 'b']);

      expect(fn).toHaveBeenCalledWith(['a', 'b']);
      expect(fn).not.toHaveBeenCalledWith({[TAGS_CONTROL]: ['a', 'b']});
    });
  });

  describe('validate', () => {
    it('should return null when the control is valid', () => {
      component.writeValue(['ok']);

      expect(component.validate(null)).toBeNull();
    });

    it('should return errors when required and empty', () => {
      const requiredFixture = TestBed.createComponent(ChipListComponent);
      const requiredComponent = requiredFixture.componentInstance;
      requiredComponent.required = true;
      requiredComponent.tags = [];
      requiredFixture.detectChanges();

      expect(requiredComponent.validate(null)).toBeTruthy();
    });
  });
});
