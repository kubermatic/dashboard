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
import {nodeDeploymentsFake} from '../../testing/fake-data/node.fake';
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
      const nd = nodeDeploymentsFake()[0];
      const clusterID = fakeDigitaloceanCluster().id;
      const projectID = fakeProject().id;
      const dcName = fakeDigitaloceanDatacenter().metadata.name;
      let isConfirmed = false;

      service
        .showNodeDeploymentDeleteDialog(nd, clusterID, projectID, dcName, null)
        .subscribe(confirmed => {
          isConfirmed = confirmed;
        });
      tick();

      expect(isConfirmed).toBeTruthy();
    })
  ));
});
