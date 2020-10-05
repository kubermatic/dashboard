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

import {HttpClientModule} from '@angular/common/http';
import {DebugElement} from '@angular/core';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {MockComponent} from 'ng2-mock-component';

import {AppConfigService} from '../../../config.service';
import {SharedModule} from '../../../shared/shared.module';
import {fakeProjects} from '../../../testing/fake-data/project.fake';
import {RouterLinkStubDirective, RouterTestingModule} from '../../../testing/router-stubs';
import {AppConfigMockService} from '../../../testing/services/app-config-mock.service';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {SettingsMockService} from '../../../testing/services/settings-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';
import {click} from '../../../testing/utils/click-handler';
import {ProjectService, UserService} from '../../services';
import {SettingsService} from '../../services/settings/settings.service';
import {ProjectSelectorComponent} from '../navigation/project/component';

import {SidenavComponent} from './sidenav.component';

const modules: any[] = [BrowserModule, RouterTestingModule, HttpClientModule, BrowserAnimationsModule, SharedModule];

describe('SidenavComponent', () => {
  let fixture: ComponentFixture<SidenavComponent>;
  let component: SidenavComponent;
  let linkDes: DebugElement[];
  let links: RouterLinkStubDirective[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
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
        {provide: SettingsService, useClass: SettingsMockService},
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
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidenavComponent);
    component = fixture.componentInstance;
    linkDes = fixture.debugElement.queryAll(By.directive(RouterLinkStubDirective));

    links = linkDes.map(de => de.injector.get(RouterLinkStubDirective) as RouterLinkStubDirective);
  });

  it('should initialize', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should get RouterLinks from template', () => {
    const expectedLinks = 5;
    fixture.detectChanges();
    expect(links.length).toBe(expectedLinks);
    expect(links[0].linkParams).toBe(`/projects/${fakeProjects()[0].id}/clusters`);
  });

  it('can click clusters link in template', () => {
    fixture.detectChanges();
    const clustersLinkDe = linkDes[0];
    const clustersLink = links[0];
    expect(clustersLink.navigatedTo).toBeNull();

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
