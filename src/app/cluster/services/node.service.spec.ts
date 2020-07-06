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

import {fakeAsync, inject, TestBed, tick} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {of} from 'rxjs';

import {CoreModule} from '../../core/core.module';
import {ApiService, NotificationService} from '../../core/services';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {fakeDigitaloceanCluster} from '../../testing/fake-data/cluster.fake';
import {fakeDigitaloceanDatacenter} from '../../testing/fake-data/datacenter.fake';
import {machineDeploymentsFake} from '../../testing/fake-data/node.fake';
import {fakeProject} from '../../testing/fake-data/project.fake';
import {ApiMockService} from '../../testing/services/api-mock.service';

import {NodeService} from './node.service';

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
        {provide: ApiService, useClass: ApiMockService},
        {provide: MatDialog, useClass: MatDialogMock},
        NotificationService,
      ],
    });
  });

  it('should initialize', inject([NodeService], (service: NodeService) => {
    expect(service).toBeTruthy();
  }));

  it('should resolve with true value', fakeAsync(
    inject([NodeService], (service: NodeService) => {
      const md = machineDeploymentsFake()[0];
      const clusterID = fakeDigitaloceanCluster().id;
      const projectID = fakeProject().id;
      const dcName = fakeDigitaloceanDatacenter().metadata.name;
      let isConfirmed = false;

      service.showMachineDeploymentDeleteDialog(md, clusterID, projectID, dcName, null).subscribe(confirmed => {
        isConfirmed = confirmed;
      });
      tick();

      expect(isConfirmed).toBeTruthy();
    })
  ));
});
