import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {MockComponent} from 'ng2-mock-component';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {AppConfigService} from '../../../../app-config.service';
import {ProjectEntity} from '../../../../shared/entity/ProjectEntity';
import {SharedModule} from '../../../../shared/shared.module';
import {fakeProjects} from '../../../../testing/fake-data/project.fake';
import {RouterTestingModule} from '../../../../testing/router-stubs';
import {ApiMockService} from '../../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../../testing/services/app-config-mock.service';
import {ProjectMockService} from '../../../../testing/services/project-mock.service';
import {UserMockService} from '../../../../testing/services/user-mock.service';
import {ApiService, ProjectService, UserService} from '../../../services';

import {SidenavComponent} from '../sidenav.component';
import {ProjectSelectorComponent} from './selector.component';

const modules: any[] = [
  BrowserModule,
  RouterTestingModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('SidenavComponent', () => {
  let fixture: ComponentFixture<ProjectSelectorComponent>;
  let component: ProjectSelectorComponent;

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            SidenavComponent,
            ProjectSelectorComponent,
            MockComponent({
              selector: 'a',
              inputs: ['routerLink', 'routerLinkActiveOptions'],
            }),
          ],
          providers: [
            {provide: ApiService, useValue: ApiMockService},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: UserService, useClass: UserMockService},
            {provide: AppConfigService, useClass: AppConfigMockService},
            {
              provide: Router,
              useValue: {
                routerState: {
                  snapshot: {url: ''},
                },
              },
            },
            MatDialog,
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectSelectorComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should correctly compare projects basing on their IDs', () => {
    const a: ProjectEntity = fakeProjects()[0];
    const b: ProjectEntity = fakeProjects()[1];
    expect(component.areProjectsEqual(a, b)).toBeFalsy();
    expect(component.areProjectsEqual(b, a)).toBeFalsy();

    b.id = a.id;
    expect(component.areProjectsEqual(a, b)).toBeTruthy();
    expect(component.areProjectsEqual(b, a)).toBeTruthy();
  });
});
