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
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {DialogTestModule, NoopConfirmDialogComponent} from '@test/components/noop-confirmation-dialog.component';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {fakeGatekeeperConfig} from '@test/data/opa';
import {fakeProject} from '@test/data/project';
import {CoreModule} from '@core/module';
import {NotificationService} from '@core/services/notification';
import {OPAService} from '@core/services/opa';
import {SharedModule} from '@shared/module';
import {of} from 'rxjs';
import {GatekeeperConfigComponent} from './component';

describe('GatekeeperConfigComponent', () => {
  let fixture: ComponentFixture<GatekeeperConfigComponent>;
  let noop: ComponentFixture<NoopConfirmDialogComponent>;
  let component: GatekeeperConfigComponent;
  let deleteGatekeeperConfigSpy: jest.Mock;

  beforeEach(waitForAsync(() => {
    const opaMock = {
      deleteGatekeeperConfig: jest.fn(),
      refreshGatekeeperConfig: () => {},
    };
    deleteGatekeeperConfigSpy = opaMock.deleteGatekeeperConfig.mockReturnValue(of(null));

    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, SharedModule, CoreModule, DialogTestModule],
      declarations: [GatekeeperConfigComponent],
      providers: [{provide: OPAService, useValue: opaMock}, MatDialog, NotificationService],
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(GatekeeperConfigComponent);
    component = fixture.componentInstance;
    noop = TestBed.createComponent(NoopConfirmDialogComponent);
    component.cluster = fakeDigitaloceanCluster();
    component.projectID = fakeProject().id;
    component.gatekeeperConfig = fakeGatekeeperConfig();
    component.isClusterRunning = true;
    fixture.detectChanges();
  }));

  it('should create the gatekeeper config component', fakeAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should open the delete gatekeeper config confirmation dialog & call delete()', fakeAsync(() => {
    const waitTime = 15000;
    component.delete();
    noop.detectChanges();
    tick(waitTime);

    const dialogTitle = document.body.querySelector('.mat-mdc-dialog-title');
    const deleteButton = document.body.querySelector('#km-confirmation-dialog-confirm-btn') as HTMLInputElement;

    expect(dialogTitle.textContent).toBe('Delete Gatekeeper Config');
    expect(deleteButton.textContent).toContain('Delete');

    deleteButton.click();

    noop.detectChanges();
    fixture.detectChanges();
    tick(waitTime);

    expect(deleteGatekeeperConfigSpy).toHaveBeenCalled();
    fixture.destroy();
    flush();
  }));

  it('should only display add button if no config is defined', () => {
    component.gatekeeperConfig = undefined;
    fixture.detectChanges();
    expect(document.body.querySelector('#km-gatekeeper-config-edit-btn')).toBeNull();
    expect(document.body.querySelector('#km-gatekeeper-config-delete-btn')).toBeNull();
    expect(document.body.querySelector('#km-gatekeeper-config-add-btn')).toBeDefined();
  });

  it('should hide add button if config is defined', () => {
    expect(document.body.querySelector('#km-gatekeeper-config-edit-btn')).toBeDefined();
    expect(document.body.querySelector('#km-gatekeeper-config-delete-btn')).toBeDefined();
    expect(document.body.querySelector('#km-gatekeeper-config-add-btn')).toBeNull();
  });
});
