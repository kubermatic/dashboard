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

import {ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync} from '@angular/core/testing';
import {MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {DEFAULT_ADMIN_SETTINGS} from '@app/shared/entity/settings';
import {CoreModule} from '@core/module';
import {ProjectService} from '@core/services/project';
import {SharedModule} from '@shared/module';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {RouterStub} from '@test/services/router-stubs';
import {AddProjectDialogComponent} from './component';

describe('AddProjectDialogComponent', () => {
  let fixture: ComponentFixture<AddProjectDialogComponent>;
  let component: AddProjectDialogComponent;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: Router, useClass: RouterStub},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(AddProjectDialogComponent);
    component = fixture.componentInstance;
    component.adminAllowedOperatingSystems = DEFAULT_ADMIN_SETTINGS.allowedOperatingSystems;
    component.labels = {};
    component.asyncLabelValidators = [];
    fixture.detectChanges();
  }));

  it('should create the add project dialog component', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should initialize project allowed operating systems with only enabled entries from admin defaults', () => {
    const expected: Record<string, boolean> = {};
    Object.keys(DEFAULT_ADMIN_SETTINGS.allowedOperatingSystems)
      .filter(os => DEFAULT_ADMIN_SETTINGS.allowedOperatingSystems[os])
      .forEach(os => (expected[os] = true));

    expect(component.projectAllowedOperatingSystems).toEqual(expected);
  });

  it('should pass the selected operating systems in the project spec when creating a project', fakeAsync(() => {
    const spy = jest.spyOn(fixture.debugElement.injector.get(ProjectService) as any, 'create');

    const expected: Record<string, boolean> = {};
    Object.keys(DEFAULT_ADMIN_SETTINGS.allowedOperatingSystems)
      .filter(os => DEFAULT_ADMIN_SETTINGS.allowedOperatingSystems[os])
      .forEach(os => (expected[os] = true));

    component.form.controls.name.patchValue('test');
    component.getObservable().subscribe();

    tick();
    flush();

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        spec: expect.objectContaining({
          allowedOperatingSystems: expected,
        }),
      })
    );
  }));

  it('should exclude disabled operating systems and only include enabled ones from admin settings', () => {
    component.adminAllowedOperatingSystems = {
      ubuntu: true,
      flatcar: true,
      amzn2: true,
      rhel: false,
      rockylinux: false,
    };
    component.ngOnInit();

    const expected: Record<string, boolean> = {};
    Object.keys(component.adminAllowedOperatingSystems)
      .filter(os => component.adminAllowedOperatingSystems[os])
      .forEach(os => (expected[os] = true));

    expect(component.projectAllowedOperatingSystems).toEqual(expected);

    // Also verify disabled OS are NOT present
    expect(component.projectAllowedOperatingSystems).not.toHaveProperty('rhel');
    expect(component.projectAllowedOperatingSystems).not.toHaveProperty('rockylinux');
  });
});
