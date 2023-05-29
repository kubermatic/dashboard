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

import {fakeAsync, flush, inject, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {GoogleAnalyticsService} from '@app/google-analytics.service';
import {fakeDigitaloceanCluster} from '@test/data/cluster';
import {machineDeploymentsFake} from '@test/data/node';
import {fakeProject} from '@test/data/project';
import {CoreModule} from '@core/module';
import {NotificationService} from '@core/services/notification';
import {NotificationMockService} from '@test/services/notification-mock';
import {of} from 'rxjs';
import {NodeService} from './node';
import {MachineDeploymentServiceMock} from '@test/services/machine-deployment-mock';
import {MachineDeploymentService} from './machine-deployment';

class MatDialogMock {
  open(): any {
    return {afterClosed: () => of(true)};
  }
}

describe('NodeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, MatSnackBarModule, CoreModule],
      providers: [
        NodeService,
        GoogleAnalyticsService,
        {provide: MatDialog, useClass: MatDialogMock},
        {provide: MachineDeploymentService, useClass: MachineDeploymentServiceMock},
        {provide: NotificationService, useClass: NotificationMockService},
      ],
      teardown: {destroyAfterEach: false},
    });
  });

  it('should initialize', inject([NodeService], (service: NodeService) => {
    expect(service).toBeTruthy();
  }));

  it('should resolve with true value', fakeAsync(
    inject([NodeService], (service: NodeService) => {
      const md = machineDeploymentsFake()[0];
      const cluster = fakeDigitaloceanCluster();
      const projectID = fakeProject().id;
      let isConfirmed = false;

      service
        .showMachineDeploymentDeleteDialog(md, cluster, projectID, null)
        .subscribe(confirmed => (isConfirmed = confirmed));
      tick();
      flush();

      expect(isConfirmed).toBeTruthy();
    })
  ));
});
