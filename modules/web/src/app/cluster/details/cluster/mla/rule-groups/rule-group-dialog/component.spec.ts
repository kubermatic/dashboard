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
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {CoreModule} from '@core/module';
import {MLAService} from '@core/services/mla';
import {NotificationService} from '@core/services/notification';
import {SharedModule} from '@shared/module';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeRuleGroups} from '@test/data/mla';
import {fakeProject} from '@test/data/project';
import {asyncData} from '@test/services/cluster-mock';
import {MatDialogRefMock} from '@test/services/mat-dialog-ref-mock';
import {MonacoEditorModule, NGX_MONACO_EDITOR_CONFIG} from 'ngx-monaco-editor-v2';
import {Mode, RuleGroupDialog} from './component';

declare let monaco: any;

describe('RuleGroupDialog', () => {
  let fixture: ComponentFixture<RuleGroupDialog>;
  let component: RuleGroupDialog;
  let editRuleGroupSpy: jest.Mock;
  let createRuleGroupSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const mlaMock = {
      createRuleGroup: jest.fn(),
      editRuleGroup: jest.fn(),
      refreshRuleGroups: () => {},
    };
    editRuleGroupSpy = mlaMock.editRuleGroup.mockReturnValue(asyncData(fakeRuleGroups()[0]));
    createRuleGroupSpy = mlaMock.createRuleGroup.mockReturnValue(asyncData(fakeRuleGroups()[0]));

    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule, MonacoEditorModule],
      declarations: [RuleGroupDialog],
      providers: [
        {provide: MatDialogRef, useClass: MatDialogRefMock},
        {provide: MLAService, useValue: mlaMock},
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: '',
            projectId: '',
            cluster: {},
            confirmLabel: '',
          },
        },
        NotificationService,
        {provide: NGX_MONACO_EDITOR_CONFIG, useValue: {onMonacoLoad: () => (monaco = (window as any).monaco)}},
      ],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  describe('Add Rule Group Dialog', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(RuleGroupDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.data = {
        title: 'Add Rule Group',
        projectId: fakeProject().id,
        cluster: fakeDigitaloceanCluster(),
        mode: Mode.Add,
        confirmLabel: 'Add',
      };
      fixture.detectChanges();
    });

    it('should create the add rule group dialog', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should have correct title: add', () => {
      expect(document.body.querySelector('km-dialog-title').textContent).toContain('Add Rule Group');
    });

    it('should have correct button text: add', () => {
      expect(document.body.querySelector('#km-rule-group-dialog-btn').textContent).toContain('Add');
    });

    xit('should call createRuleGroup()', () => {
      // component.save();
      fixture.detectChanges();
      expect(createRuleGroupSpy).toHaveBeenCalled();
    });
  });

  describe('Edit Rule Group Dialog', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(RuleGroupDialog);
      component = fixture.componentInstance;

      component.data = {
        title: 'Edit Rule Group',
        projectId: fakeProject().id,
        cluster: fakeDigitaloceanCluster(),
        confirmLabel: 'Edit',
        mode: Mode.Edit,
        ruleGroup: fakeRuleGroups()[0],
      };
      fixture.detectChanges();
    });

    it('should create the edit rule group dialog', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should have correct title: edit', () => {
      expect(document.body.querySelector('km-dialog-title').textContent).toContain('Edit Rule Group');
    });

    it('should have correct button text: edit', () => {
      expect(document.body.querySelector('#km-rule-group-dialog-btn').textContent).toContain('Edit');
    });

    xit('should call editRuleGroup()', () => {
      // component.save();
      fixture.detectChanges();
      expect(editRuleGroupSpy).toHaveBeenCalled();
    });
  });
});
