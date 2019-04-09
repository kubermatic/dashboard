import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {of} from 'rxjs';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, ProjectService, UserService} from '../../../core/services';
import {GoogleAnalyticsService} from '../../../google-analytics.service';
import {SharedModule} from '../../../shared/shared.module';
import {RouterStub} from '../../../testing/router-stubs';
import {ApiMockService} from '../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {NodeMockService} from '../../../testing/services/node-mock.service';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';
import {NodeService} from '../../services/node.service';

import {NodeDeploymentListComponent} from './node-deployment-list.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

class MatDialogMock {
  open() {
    return {afterClosed: () => of([true])};
  }
}

describe('NodeDeploymentListComponent', () => {
  let fixture: ComponentFixture<NodeDeploymentListComponent>;
  let component: NodeDeploymentListComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            NodeDeploymentListComponent,
          ],
          providers: [
            {provide: ApiService, useClass: ApiMockService},
            {provide: NodeService, useClass: NodeMockService},
            {provide: UserService, useClass: UserMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: MatDialog, useClass: MatDialogMock},
            {provide: Router, useClass: RouterStub},
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeDeploymentListComponent);
    component = fixture.componentInstance;
  });

  it('should create the cluster details cmp', async(() => {
       expect(component).toBeTruthy();
     }));
});
