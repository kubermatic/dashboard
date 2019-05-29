import {HttpClientModule} from '@angular/common/http';
import {DebugElement} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {MockComponent} from 'ng2-mock-component';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {AppConfigService} from '../../../app-config.service';
import {ProjectEntity} from '../../../shared/entity/ProjectEntity';
import {SharedModule} from '../../../shared/shared.module';
import {fakeProjects} from '../../../testing/fake-data/project.fake';
import {RouterLinkStubDirective, RouterTestingModule} from '../../../testing/router-stubs';
import {asyncData} from '../../../testing/services/api-mock.service';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';
import {click} from '../../../testing/utils/click-handler';
import {ApiService, ProjectService, UserService} from '../../services';

import {SidenavComponent} from './sidenav.component';

const modules: any[] = [
  BrowserModule,
  RouterTestingModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('SidenavComponent', () => {
  let fixture: ComponentFixture<SidenavComponent>;
  let component: SidenavComponent;
  let linkDes: DebugElement[];
  let links: RouterLinkStubDirective[];

  beforeEach(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getProjects']);
    apiMock.getProjects.and.returnValue(asyncData(fakeProjects()));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            SidenavComponent,
            MockComponent({
              selector: 'a',
              inputs: ['routerLink', 'routerLinkActiveOptions'],
            }),
          ],
          providers: [
            {provide: ApiService, useValue: apiMock},
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
    fixture = TestBed.createComponent(SidenavComponent);
    component = fixture.componentInstance;
    linkDes = fixture.debugElement.queryAll(By.directive(RouterLinkStubDirective));

    links = linkDes.map((de) => de.injector.get(RouterLinkStubDirective) as RouterLinkStubDirective);
  });

  it('should create the sidenav cmp', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should get RouterLinks from template', () => {
    fixture.detectChanges();
    expect(links.length).toBe(5, 'should have 5 links');
    expect(links[0].linkParams).toBe('/projects//clusters', 'first link should go to clusters page');
  });


  it('can click clusters link in template', () => {
    fixture.detectChanges();
    const clustersLinkDe = linkDes[0];
    const clustersLink = links[0];
    expect(clustersLink.navigatedTo).toBeNull('link should not have navigated yet');

    click(clustersLinkDe);
    fixture.detectChanges();
    expect(clustersLink.navigatedTo).toBe('/projects//clusters');
  });

  it('should correctly compare projects basing on their IDs', () => {
    const a: ProjectEntity = fakeProjects()[0];
    const b: ProjectEntity = fakeProjects()[1];
    expect(component.projectService.areProjectsEqual(a, b)).toBeFalsy();
    expect(component.projectService.areProjectsEqual(b, a)).toBeFalsy();

    b.id = a.id;
    expect(component.projectService.areProjectsEqual(a, b)).toBeTruthy();
    expect(component.projectService.areProjectsEqual(b, a)).toBeTruthy();
  });

  it('should correctly create router links', () => {
    component.selectedProject = fakeProjects()[0];
    expect(component.getRouterLink('clusters')).toBe('/projects/' + fakeProjects()[0].id + '/clusters');
    expect(component.getRouterLink('members')).toBe('/projects/' + fakeProjects()[0].id + '/members');

    component.selectedProject.id = fakeProjects()[1].id;
    expect(component.getRouterLink('clusters')).toBe('/projects/' + fakeProjects()[1].id + '/clusters');
    expect(component.getRouterLink('members')).toBe('/projects/' + fakeProjects()[1].id + '/members');
  });
});
