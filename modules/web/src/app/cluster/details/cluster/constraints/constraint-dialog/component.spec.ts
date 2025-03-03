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
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CoreModule } from '@core/module';
import { NotificationService } from '@core/services/notification';
import { OPAService } from '@core/services/opa';
import { SharedModule } from '@shared/module';
import { DialogActionMode } from '@shared/types/common';
import { fakeDigitaloceanCluster } from '@test/data/cluster';
import { fakeConstraints, fakeConstraintTemplates } from '@test/data/opa';
import { fakeProject } from '@test/data/project';
import { asyncData } from '@test/services/cluster-mock';
import { MatDialogRefMock } from '@test/services/mat-dialog-ref-mock';
import { MonacoEditorModule, NGX_MONACO_EDITOR_CONFIG } from 'ngx-monaco-editor-v2';
import { of } from 'rxjs';
import { ConstraintDialog } from './component';

declare let monaco: any;

describe('ConstraintDialog', () => {
  let fixture: ComponentFixture<ConstraintDialog>;
  let component: ConstraintDialog;
  let createConstraintSpy: jest.Mock;
  let patchConstraintSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const opaMock = {
      createConstraint: jest.fn(),
      patchConstraint: jest.fn(),
      constraintTemplates: of(fakeConstraintTemplates()),
      refreshConstraint: () => {},
    };
    createConstraintSpy = opaMock.createConstraint.mockReturnValue(asyncData(fakeConstraints()[0]));
    patchConstraintSpy = opaMock.patchConstraint.mockReturnValue(asyncData(fakeConstraints()[0]));

    TestBed.configureTestingModule({
      imports: [BrowserModule, NoopAnimationsModule, SharedModule, CoreModule, MonacoEditorModule],
      declarations: [ConstraintDialog],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: OPAService, useValue: opaMock},
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: '',
            projectId: '',
            cluster: {},
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

  describe('Add Constraint Dialog', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ConstraintDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.data = {
        title: 'Add Constraint',
        projectId: fakeProject().id,
        cluster: fakeDigitaloceanCluster(),
        mode: DialogActionMode.Add,
        confirmLabel: 'Add',
      };
      fixture.detectChanges();
    });

    it('should create the add constraint dialog', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should have correct title: add', () => {
      expect(document.body.querySelector('km-dialog-title').textContent).toBe('Add Constraint');
    });

    it('should have correct button text: add', () => {
      expect(document.body.querySelector('#km-constraint-dialog-btn').textContent).toContain('Add');
    });

    xit('should call createConstraint()', () => {
      // component.save();
      fixture.detectChanges();
      expect(createConstraintSpy).toHaveBeenCalled();
    });
  });

  describe('Edit Constraint Dialog', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(ConstraintDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.data = {
        title: 'Edit Constraint',
        projectId: fakeProject().id,
        cluster: fakeDigitaloceanCluster(),
        mode: DialogActionMode.Edit,
        confirmLabel: 'Edit',
        constraint: fakeConstraints()[0],
      };
      fixture.detectChanges();
    });

    it('should create the edit constraint dialog', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should have correct title: edit', () => {
      expect(document.body.querySelector('km-dialog-title').textContent).toContain('Edit Constraint');
    });

    it('should have correct button text: edit', () => {
      expect(document.body.querySelector('#km-constraint-dialog-btn').textContent).toContain('Save Changes');
    });

    xit('should call patchConstraint()', () => {
      // component.save();
      fixture.detectChanges();
      expect(patchConstraintSpy).toHaveBeenCalled();
    });
  });
});
