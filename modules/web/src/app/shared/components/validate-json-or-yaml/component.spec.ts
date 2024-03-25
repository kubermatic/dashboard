// Copyright 2022 The Kubermatic Kubernetes Platform contributors.
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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatFormFieldModule} from '@angular/material/form-field';
import {ValidateJsonOrYamlComponent} from './component';

describe('ValidateJsonOrYamlComponent', () => {
  let component: ValidateJsonOrYamlComponent;
  let fixture: ComponentFixture<ValidateJsonOrYamlComponent>;

  beforeEach(waitForAsync(async () => {
    await TestBed.configureTestingModule({
      declarations: [ValidateJsonOrYamlComponent],
      imports: [MatFormFieldModule],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidateJsonOrYamlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show hint message when valid data is entered', () => {
    component.isDataValid = true;
    fixture.detectChanges();

    const element = fixture.debugElement.nativeElement.querySelector('mat-hint');

    expect(element).toBeTruthy();
  });

  it('should show hint message when data has not been entered', () => {
    component.data = null;
    fixture.detectChanges();

    const element = fixture.debugElement.nativeElement.querySelector('mat-hint');

    expect(element).toBeTruthy();
  });

  it('should have correct hint message when validating both JSON and YAML', () => {
    component.isDataValid = true;
    component.isOnlyYAML = false;
    fixture.detectChanges();

    const element = fixture.debugElement.nativeElement.querySelector('mat-hint');

    expect(element.textContent.trim()).toEqual('Input should be valid JSON or YAML');
  });

  it('should have correct hint message when validating only YAML', () => {
    component.isDataValid = true;
    component.isOnlyYAML = true;
    fixture.detectChanges();

    const element = fixture.debugElement.nativeElement.querySelector('mat-hint');

    expect(element.textContent.trim()).toEqual('Input should be valid YAML');
  });

  it('should not show hint message when invalid data is entered', () => {
    component.isDataValid = false;
    component.data = 'sample text';
    fixture.detectChanges();

    const element = fixture.debugElement.nativeElement.querySelector('mat-hint');

    expect(element).toBeFalsy();
  });

  it('should show error message when invalid data is entered', () => {
    component.isDataValid = false;
    component.data = 'sample text';
    fixture.detectChanges();

    const element = fixture.debugElement.nativeElement.querySelector('mat-error');

    expect(element).toBeTruthy();
  });

  it('should show correct error message when validating both JSON and YAML', () => {
    component.isDataValid = false;
    component.data = 'sample text';
    component.isOnlyYAML = false;
    fixture.detectChanges();

    const element = fixture.debugElement.nativeElement.querySelector('mat-error');

    expect(element.textContent.trim()).toEqual('Please enter valid JSON or YAML');
  });

  it('should show correct error message when validating YAML', () => {
    component.isDataValid = false;
    component.data = 'sample text';
    component.isOnlyYAML = true;
    fixture.detectChanges();

    const element = fixture.debugElement.nativeElement.querySelector('mat-error');

    expect(element.textContent.trim()).toEqual('Please enter valid YAML');
  });

  it('should call _setIsDataValid() when ngOnChanges() is called', () => {
    // @ts-expect-error
    const spy = jest.spyOn(component, '_setIsDataValid');

    component.ngOnChanges({
      data: {firstChange: false, currentValue: '', previousValue: null, isFirstChange: () => false},
    });

    expect(spy).toHaveBeenCalled();
  });

  it('should call _verifyYAML() when isOnlyYAML is true and _setIsDataValid() is called', () => {
    component.isOnlyYAML = true;
    const spy = jest.spyOn(component, <never>'_verifyYAML');

    component['_setIsDataValid'](component.data);

    expect(spy).toHaveBeenCalled();
  });

  it('should call _verifyYAML() when isOnlyYAML is false and _setIsDataValid() is called', () => {
    component.isOnlyYAML = false;
    const spy = jest.spyOn(component, <never>'_verifyYAML');

    component['_setIsDataValid'](component.data);

    expect(spy).toHaveBeenCalled();
  });

  it('should call _verifyJSON() when isOnlyYAML is false and _setIsDataValid() is called', () => {
    component.isOnlyYAML = false;
    const spy = jest.spyOn(component, <never>'_verifyJSON');

    component['_setIsDataValid'](component.data);

    expect(spy).toHaveBeenCalled();
  });

  it('should not call _verifyJSON() when isOnlyYAML is true and _setIsDataValid() is called', () => {
    component.isOnlyYAML = true;
    const spy = jest.spyOn(component, <never>'_verifyJSON');

    component['_setIsDataValid'](component.data);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should set isDataValid to true when isOnlyYAML is false, _verifyYAML() returns true and _verifyJSON() returns false and _setIsDataValid() is called', () => {
    component.isOnlyYAML = false;
    component['_verifyYAML'] = jest.fn(() => true);
    component['_verifyJSON'] = jest.fn(() => false);

    component['_setIsDataValid'](component.data);

    expect(component.isDataValid).toEqual(true);
  });

  it('should set isDataValid to true when isOnlyYAML is false, _verifyJSON() returns true and _verifyYAML() returns false and _setIsDataValid() is called', () => {
    component.isOnlyYAML = false;
    component['_verifyJSON'] = jest.fn(() => true);
    component['_verifyYAML'] = jest.fn(() => false);

    component['_setIsDataValid'](component.data);

    expect(component.isDataValid).toEqual(true);
  });

  it('should set isDataValid to false when isOnlyYAML is false, _verifyJSON() and _verifyYAML() returns false and _setIsDataValid() is called', () => {
    component.isOnlyYAML = false;
    component['_verifyJSON'] = jest.fn(() => false);
    component['_verifyYAML'] = jest.fn(() => false);

    component['_setIsDataValid'](component.data);

    expect(component.isDataValid).toEqual(false);
  });

  it('should set isDataValid to true when _verifyYAML() returns true and _setIsDataValid() is called', () => {
    component.isOnlyYAML = true;
    component['_verifyYAML'] = jest.fn(() => true);

    component['_setIsDataValid'](component.data);

    expect(component.isDataValid).toEqual(true);
  });

  it('should set isDataValid to false when _verifyYAML() returns false and _setIsDataValid() is called', () => {
    component.isOnlyYAML = true;
    component['_verifyYAML'] = jest.fn(() => false);

    component['_setIsDataValid'](component.data);

    expect(component.isDataValid).toEqual(false);
  });
});
