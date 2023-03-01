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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {fakeConstraints, fakeConstraintTemplates} from '@test/data/opa';
import {asyncData} from '@test/services/cluster-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {CoreModule} from '@core/module';
import {NotificationService} from '@core/services/notification';
import {OPAService} from '@core/services/opa';
import {SharedModule} from '@shared/module';
import {MonacoEditorModule, NGX_MONACO_EDITOR_CONFIG} from 'ngx-monaco-editor';
import {of} from 'rxjs';
import {DefaultConstraintDialog} from './component';
import {DialogActionMode} from '@shared/types/common';

declare let monaco: any;

describe('DefaultConstraintDialog', () => {
  let fixture: ComponentFixture<DefaultConstraintDialog>;
  let component: DefaultConstraintDialog;
  let createDefaultConstraintSpy: jest.Mock;
  let patchDefaultConstraintSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const opaMock = {
      createDefaultConstraint: jest.fn(),
      patchDefaultConstraint: jest.fn(),
      constraintTemplates: of(fakeConstraintTemplates()),
      refreshConstraint: () => {},
    };
    createDefaultConstraintSpy = opaMock.createDefaultConstraint.mockReturnValue(asyncData(fakeConstraints()[0]));
    patchDefaultConstraintSpy = opaMock.patchDefaultConstraint.mockReturnValue(asyncData(fakeConstraints()[0]));

    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule, MonacoEditorModule],
      declarations: [DefaultConstraintDialog],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: OPAService, useValue: opaMock},
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: '',
            mode: '',
            confirmLabel: '',
          },
        },
        NotificationService,
        {provide: NGX_MONACO_EDITOR_CONFIG, useValue: {onMonacoLoad: () => (monaco = (window as any).monaco)}},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  describe('Add Default Constraint Dialog', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(DefaultConstraintDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.data = {
        title: 'Add Default Constraint',
        mode: DialogActionMode.Add,
        confirmLabel: 'Add',
      };
      fixture.detectChanges();
    });

    it('should create the add default constraint dialog', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should have correct title: add', () => {
      expect(document.body.querySelector('km-dialog-title').textContent).toBe('Add Default Constraint');
    });

    it('should have correct button text: add', () => {
      expect(document.body.querySelector('#km-default-constraint-dialog-btn').textContent).toContain('Add');
    });

    xit('should call createDefaultConstraint()', () => {
      // component.save();
      fixture.detectChanges();
      expect(createDefaultConstraintSpy).toHaveBeenCalled();
    });
  });

  describe('Edit Default Constraint Dialog', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(DefaultConstraintDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.data = {
        title: 'Edit Default Constraint',
        mode: DialogActionMode.Edit,
        confirmLabel: 'Edit',
        defaultConstraint: fakeConstraints()[0],
      };
      fixture.detectChanges();
    });

    it('should create the edit default constraint dialog', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should have correct title: edit', () => {
      expect(document.body.querySelector('km-dialog-title').textContent).toContain('Edit Default Constraint');
    });

    it('should have correct button text: edit', () => {
      expect(document.body.querySelector('#km-default-constraint-dialog-btn').textContent).toContain('Save Changes');
    });

    xit('should call patchDefaultConstraint()', () => {
      // component.save();
      fixture.detectChanges();
      expect(patchDefaultConstraintSpy).toHaveBeenCalled();
    });
  });
});
