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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from '@core/module';
import { NotificationService } from '@core/services/notification';
import { OPAService } from '@core/services/opa';
import { SharedModule } from '@shared/module';
import { DialogActionMode } from '@shared/types/common';
import { fakeConstraintTemplates } from '@test/data/opa';
import { asyncData } from '@test/services/cluster-mock';
import { MatDialogRefMock } from '@test/services/mat-dialog-ref-mock';
import { MonacoEditorModule, NGX_MONACO_EDITOR_CONFIG } from 'ngx-monaco-editor-v2';
import { ConstraintTemplateDialog } from './component';

declare let monaco: any;

describe('ConstraintTemplateDialog', () => {
  let fixture: ComponentFixture<ConstraintTemplateDialog>;
  let component: ConstraintTemplateDialog;
  let createCTSpy: jest.Mock;
  let patchCTSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const opaMock = {
      createConstraintTemplate: jest.fn(),
      patchConstraintTemplate: jest.fn(),
      refreshConstraintTemplates: () => {},
    };
    createCTSpy = opaMock.createConstraintTemplate.mockReturnValue(asyncData(fakeConstraintTemplates()[0]));
    patchCTSpy = opaMock.patchConstraintTemplate.mockReturnValue(asyncData(fakeConstraintTemplates()[0]));

    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule, MonacoEditorModule],
      declarations: [ConstraintTemplateDialog],
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

  describe('Add Constraint Template Dialog', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ConstraintTemplateDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.data = {
        title: 'Add Constraint Template',
        mode: DialogActionMode.Add,
        confirmLabel: 'Add',
      };
      fixture.detectChanges();
    });

    it('should create the add constraint template dialog', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should have correct title: add', () => {
      expect(document.body.querySelector('km-dialog-title').textContent).toBe('Add Constraint Template');
    });

    it('should have correct button text: add', () => {
      expect(document.body.querySelector('#km-constraint-template-dialog-btn').textContent).toContain('Add');
    });

    xit('should call createConstraintTemplate()', () => {
      // component.save();
      fixture.detectChanges();
      expect(createCTSpy).toHaveBeenCalled();
    });
  });

  describe('Edit Constraint Template Dialog', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ConstraintTemplateDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.data = {
        title: 'Edit Constraint Template',
        mode: DialogActionMode.Edit,
        confirmLabel: 'Edit',
        constraintTemplate: fakeConstraintTemplates()[0],
      };
      fixture.detectChanges();
    });

    it('should create the edit constraint template dialog', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should have correct title: edit', () => {
      expect(document.body.querySelector('km-dialog-title').textContent).toContain('Edit Constraint Template');
    });

    it('should have correct button text: edit', () => {
      expect(document.body.querySelector('#km-constraint-template-dialog-btn').textContent).toContain('Save Changes');
    });

    xit('should call patchConstraintTemplate()', () => {
      // component.save();
      fixture.detectChanges();
      expect(patchCTSpy).toHaveBeenCalled();
    });
  });
});
