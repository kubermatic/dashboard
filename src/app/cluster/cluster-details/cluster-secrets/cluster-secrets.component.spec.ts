import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {AppConfigService} from '../../../app-config.service';
import {ApiService, ProjectService} from '../../../core/services';
import {SharedModule} from '../../../shared/shared.module';
import {fakeHealth} from '../../../testing/fake-data/health.fake';
import {RouterStub} from '../../../testing/router-stubs';
import {asyncData} from '../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {ProjectMockService} from '../../../testing/services/project-mock.service';

import {ClusterSecretsComponent} from './cluster-secrets.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('ClusterSecretsComponent', () => {
  let fixture: ComponentFixture<ClusterSecretsComponent>;
  let component: ClusterSecretsComponent;

  beforeEach(async(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getClusterHealth']);
    apiMock.getClusterHealth.and.returnValue(asyncData([fakeHealth()]));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            ClusterSecretsComponent,
          ],
          providers: [
            {provide: ApiService, useValue: apiMock},
            {provide: AppConfigService, useClass: AppConfigMockService},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: Router, useClass: RouterStub},
            MatDialog,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterSecretsComponent);
    component = fixture.componentInstance;
  });

  it('should create the cluster secrets cmp', async(() => {
       expect(component).toBeTruthy();
     }));
});
