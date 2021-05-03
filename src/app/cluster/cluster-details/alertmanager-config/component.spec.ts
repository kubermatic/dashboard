// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {ComponentFixture, fakeAsync, TestBed, waitForAsync, tick, flush} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DialogTestModule, NoopConfirmDialogComponent} from '@app/testing/components/noop-confirmation-dialog.component';
import {fakeDigitaloceanCluster} from '@app/testing/fake-data/cluster.fake';
import {fakeAlertmanagerConfig} from '@app/testing/fake-data/mla';
import {fakeProject} from '@app/testing/fake-data/project.fake';
import {CoreModule} from '@core/module';
import {NotificationService} from '@core/services/notification/service';
import {MLAService} from '@core/services/mla';
import {SharedModule} from '@shared/shared.module';
import {of} from 'rxjs';
import {AlertmanagerConfigComponent} from './component';

const modules: any[] = [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule, DialogTestModule];

describe('AlertmanagerConfigComponent', () => {
  let fixture: ComponentFixture<AlertmanagerConfigComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: AlertmanagerConfigComponent;
  let deleteAlertmanagerConfigSpy;

  beforeEach(
    waitForAsync(() => {
      const mlaMock = {
        deleteAlertmanagerConfig: jest.fn(),
        refreshAlertmanagerConfig: () => {},
      };
      deleteAlertmanagerConfigSpy = mlaMock.deleteAlertmanagerConfig.mockReturnValue(of(null));

      TestBed.configureTestingModule({
        imports: [...modules],
        declarations: [AlertmanagerConfigComponent],
        providers: [{provide: MLAService, useValue: mlaMock}, MatDialog, NotificationService],
      }).compileComponents();
    })
  );

  beforeEach(
    waitForAsync(() => {
      fixture = TestBed.createComponent(AlertmanagerConfigComponent);
      component = fixture.componentInstance;
      noop = TestBed.createComponent(NoopConfirmDialogComponent);
      component.cluster = fakeDigitaloceanCluster();
      component.projectID = fakeProject().id;
      component.alertmanagerConfig = fakeAlertmanagerConfig();
      component.isClusterRunning = true;
      fixture.detectChanges();
    })
  );

  it('should create the alertmanager config component', fakeAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should open the delete alertmanager config confirmation dialog & call delete()', fakeAsync(() => {
    const waitTime = 15000;
    component.delete();
    noop.detectChanges();
    tick(waitTime);

    const dialogTitle = document.body.querySelector('.mat-dialog-title');
    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

    expect(dialogTitle.textContent).toBe('Delete Alertmanager Config');
    expect(deleteButton.textContent).toBe(' Delete ');

    deleteButton.click();

    noop.detectChanges();
    fixture.detectChanges();
    tick(waitTime);

    expect(deleteAlertmanagerConfigSpy).toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));

  xit('should only display add button if no config is defined', () => {
    component.alertmanagerConfig = undefined;
    fixture.detectChanges();
    expect(document.body.querySelector('#km-alertmanager-config-edit-btn')).toBeNull();
    expect(document.body.querySelector('#km-alertmanager-config-delete-btn')).toBeNull();
    expect(document.body.querySelector('#km-alertmanager-config-add-btn')).toBeDefined();
  });

  xit('should hide add button if config is defined', () => {
    expect(document.body.querySelector('#km-alertmanager-config-edit-btn')).toBeDefined();
    expect(document.body.querySelector('#km-alertmanager-config-delete-btn')).toBeDefined();
    expect(document.body.querySelector('#km-alertmanager-config-add-btn')).toBeNull();
  });
});
