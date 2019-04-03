import {HttpClientModule} from '@angular/common/http';
import {DebugElement} from '@angular/core/src/debug/debug_node';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {MockComponent} from 'ng2-mock-component';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {AppConfigService} from '../../../app-config.service';
import {CustomLink, CustomLinkIcon} from '../../../shared/entity/CustomLinks';
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
    expect(component.projectService.compareProjectsEquality(a, b)).toBeFalsy();
    expect(component.projectService.compareProjectsEquality(b, a)).toBeFalsy();

    b.id = a.id;
    expect(component.projectService.compareProjectsEquality(a, b)).toBeTruthy();
    expect(component.projectService.compareProjectsEquality(b, a)).toBeTruthy();
  });

  it('should correctly create router links', () => {
    component.selectedProject = fakeProjects()[0];
    expect(component.getRouterLink('clusters')).toBe('/projects/' + fakeProjects()[0].id + '/clusters');
    expect(component.getRouterLink('members')).toBe('/projects/' + fakeProjects()[0].id + '/members');

    component.selectedProject.id = fakeProjects()[1].id;
    expect(component.getRouterLink('clusters')).toBe('/projects/' + fakeProjects()[1].id + '/clusters');
    expect(component.getRouterLink('members')).toBe('/projects/' + fakeProjects()[1].id + '/members');
  });

  it('should correctly assign icons', () => {
    const a: CustomLink = {label: 'Unknown Service', url: 'www.unknown.com'};
    expect(component.getCustomIcon(a)).toBe(CustomLinkIcon.Default);

    const b: CustomLink = {label: '', url: ''};
    expect(component.getCustomIcon(b)).toBe(CustomLinkIcon.Default);

    const c: CustomLink = {label: 'Twitter', url: 'www.twitter.com'};
    expect(component.getCustomIcon(c)).toBe(CustomLinkIcon.Twitter);

    const d: CustomLink = {label: 'Slack', url: '192.168.1.1:8080'};
    expect(component.getCustomIcon(d)).toBe(CustomLinkIcon.Slack);

    const e: CustomLink = {label: 'Repository', url: 'www.github.com'};
    expect(component.getCustomIcon(e)).toBe(CustomLinkIcon.GitHub);

    const f: CustomLink = {label: 'Unknown Service', url: 'www.unknown.com', icon: ''};
    expect(component.getCustomIcon(f)).toBe(CustomLinkIcon.Default);

    const g: CustomLink = {label: 'Unknown Service', url: 'www.unknown.com', icon: 'www.google.com/some-image.png'};
    expect(component.getCustomIcon(g)).toBe(g.icon);

    const h: CustomLink = {label: 'Slack', url: 'www.twitter.com', icon: 'www.google.com/some-image.png'};
    expect(component.getCustomIcon(h)).toBe(h.icon);

    const i: CustomLink = {label: '', url: '', icon: '/assets-mounted-into-container/icons/slack.svg'};
    expect(component.getCustomIcon(i)).toBe(i.icon);

    const j: CustomLink = {label: 'Slack', url: 'slack.com', icon: '/assets-mounted-into-container/icons/github.svg'};
    expect(component.getCustomIcon(j)).toBe(j.icon);
  });
});
