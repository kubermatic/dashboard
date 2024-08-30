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
import { fakeDigitaloceanCluster } from '@test/data/cluster';
import { fakeGatekeeperConfig } from '@test/data/opa';
import { fakeProject } from '@test/data/project';
import { asyncData } from '@test/services/cluster-mock';
import { MatDialogRefMock } from '@test/services/mat-dialog-ref-mock';
import { MonacoEditorModule, NGX_MONACO_EDITOR_CONFIG } from 'ngx-monaco-editor-v2';
import { GatekeeperConfigDialog } from './component';

declare let monaco: any;

describe('GatekeeperConfigDialog', () => {
  let fixture: ComponentFixture<GatekeeperConfigDialog>;
  let component: GatekeeperConfigDialog;
  let createGatekeeperConfigSpy: jest.Mock;
  let patchGatekeeperConfigSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const opaMock = {
      createGatekeeperConfig: jest.fn(),
      patchGatekeeperConfig: jest.fn(),
      refreshGatekeeperConfig: () => {},
    };
    createGatekeeperConfigSpy = opaMock.createGatekeeperConfig.mockReturnValue(asyncData(fakeGatekeeperConfig()));
    patchGatekeeperConfigSpy = opaMock.patchGatekeeperConfig.mockReturnValue(asyncData(fakeGatekeeperConfig()));

    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule, MonacoEditorModule],
      declarations: [GatekeeperConfigDialog],
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

  describe('Add Gatekeeper Config Dialog', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(GatekeeperConfigDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.data = {
        title: 'Add Gatekeeper Config',
        projectId: fakeProject().id,
        cluster: fakeDigitaloceanCluster(),
        mode: DialogActionMode.Add,
        confirmLabel: 'Add',
      };
      fixture.detectChanges();
    });

    it('should create the add gatekeeper config dialog', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should have correct title: add', () => {
      expect(document.body.querySelector('km-dialog-title').textContent).toBe('Add Gatekeeper Config');
    });

    it('should have correct button text: add', () => {
      expect(document.body.querySelector('#km-gatekeeper-config-dialog-btn').textContent).toContain('Add');
    });

    xit('should call createGatekeeperConfig()', () => {
      // component.save();
      fixture.detectChanges();
      expect(createGatekeeperConfigSpy).toHaveBeenCalled();
    });
  });

  describe('Edit Gatekeeper Config Dialog', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(GatekeeperConfigDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();

      component.data = {
        title: 'Edit Gatekeeper Config',
        projectId: fakeProject().id,
        cluster: fakeDigitaloceanCluster(),
        mode: DialogActionMode.Edit,
        confirmLabel: 'Edit',
        gatekeeperConfig: fakeGatekeeperConfig(),
      };
      fixture.detectChanges();
    });

    it('should create the edit gatekeeper config dialog', waitForAsync(() => {
      expect(component).toBeTruthy();
    }));

    it('should have correct title: edit', () => {
      expect(document.body.querySelector('km-dialog-title').textContent).toContain('Edit Gatekeeper Config');
    });

    it('should have correct button text: edit', () => {
      expect(document.body.querySelector('#km-gatekeeper-config-dialog-btn').textContent).toContain('Save Changes');
    });

    xit('should call patchGatekeeperConfig()', () => {
      // component.save();
      fixture.detectChanges();
      expect(patchGatekeeperConfigSpy).toHaveBeenCalled();
    });
  });
});
