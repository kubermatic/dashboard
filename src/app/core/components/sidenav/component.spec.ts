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

import {HttpClientModule} from '@angular/common/http';
import {DebugElement} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {fakeProjects} from '@app/testing/fake-data/project';
import {RouterLinkStubDirective, RouterTestingModule} from '@app/testing/router-stubs';
import {AppConfigMockService} from '@app/testing/services/app-config-mock';
import {ProjectMockService} from '@app/testing/services/project-mock';
import {SettingsMockService} from '@app/testing/services/settings-mock';
import {UserMockService} from '@app/testing/services/user-mock';
import {click} from '@app/testing/utils/click-handler';
import {ProjectSelectorComponent} from '@core/components/navigation/project/component';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {SharedModule} from '@shared/module';
import {MockComponent} from 'ng2-mock-component';
import {SidenavComponent} from './component';
import {View} from '@shared/entity/common';

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
      teardown: {destroyAfterEach: false},
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidenavComponent);
    component = fixture.componentInstance;
    linkDes = fixture.debugElement.queryAll(By.directive(RouterLinkStubDirective));

    links = linkDes.map(de => de.injector.get(RouterLinkStubDirective) as RouterLinkStubDirective);
  });

  it(
    'should initialize',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it('should get RouterLinks from template', () => {
    const expectedLinks = 7;
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
    expect(component.getRouterLink(View.Clusters)).toBe('/projects/' + fakeProjects()[0].id + '/clusters');
    expect(component.getRouterLink(View.Members)).toBe('/projects/' + fakeProjects()[0].id + '/members');
  });
});
