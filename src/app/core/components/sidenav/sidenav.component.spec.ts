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
import {SharedModule} from '../../../shared/shared.module';
import {fakeProjects} from '../../../testing/fake-data/project.fake';
import {RouterLinkStubDirective, RouterTestingModule} from '../../../testing/router-stubs';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';
import {click} from '../../../testing/utils/click-handler';
import {ProjectService, UserService} from '../../services';
import {ProjectSelectorComponent} from './project/selector.component';

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
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            ProjectSelectorComponent,
            SidenavComponent,
            MockComponent({
              selector: 'a',
              inputs: ['routerLink', 'routerLinkActiveOptions'],
            }),
          ],
          providers: [
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
    expect(links[0].linkParams)
        .toBe(`/projects/${fakeProjects()[0].id}/clusters`, 'first link should go to clusters page');
  });


  it('can click clusters link in template', () => {
    fixture.detectChanges();
    const clustersLinkDe = linkDes[0];
    const clustersLink = links[0];
    expect(clustersLink.navigatedTo).toBeNull('link should not have navigated yet');

    click(clustersLinkDe);
    fixture.detectChanges();
    expect(clustersLink.navigatedTo).toBe(`/projects/${fakeProjects()[0].id}/clusters`);
  });

  it('should correctly create router links', () => {
    fixture.detectChanges();
    expect(component.getRouterLink('clusters')).toBe('/projects/' + fakeProjects()[0].id + '/clusters');
    expect(component.getRouterLink('members')).toBe('/projects/' + fakeProjects()[0].id + '/members');
  });
});
