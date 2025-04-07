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
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Router} from '@angular/router';
import {AppConfigService} from '@app/config.service';
import {ProjectSelectorComponent} from '@core/components/navigation/project/component';
import {ProjectService} from '@core/services/project';
import {SettingsService} from '@core/services/settings';
import {UserService} from '@core/services/user';
import {View} from '@shared/entity/common';
import {SharedModule} from '@shared/module';
import {fakeProjects} from '@test/data/project';
import {AppConfigMockService} from '@test/services/app-config-mock';
import {ProjectMockService} from '@test/services/project-mock';
import {
  ActivatedRouteStub,
  RouterLinkActiveStubDirective,
  RouterLinkStubDirective,
  RouterOutletStubComponent,
} from '@test/services/router-stubs';
import {SettingsMockService} from '@test/services/settings-mock';
import {UserMockService} from '@test/services/user-mock';
import {click} from '@test/utils/click-handler';
import {MockComponent} from 'ng2-mock-component';
import {SidenavComponent} from './component';

describe('SidenavComponent', () => {
  let fixture: ComponentFixture<SidenavComponent>;
  let component: SidenavComponent;
  let linkDes: DebugElement[];
  let links: RouterLinkStubDirective[];

  beforeEach(() => {
    const MockLink = MockComponent({
      selector: 'a',
      inputs: ['routerLink', 'routerLinkActiveOptions'],
    });
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpClientModule,
        NoopAnimationsModule,
        RouterLinkStubDirective,
        RouterLinkActiveStubDirective,
        RouterOutletStubComponent,
        SharedModule,
        MockLink,
      ],
      declarations: [ProjectSelectorComponent, SidenavComponent],
      providers: [
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: UserService, useClass: UserMockService},
        {provide: SettingsService, useClass: SettingsMockService},
        {provide: AppConfigService, useClass: AppConfigMockService},
        {provide: ActivatedRoute, useClass: ActivatedRouteStub},
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

  it('should initialize', waitForAsync(() => {
    expect(component).toBeTruthy();
  }));

  it('should get RouterLinks from template', () => {
    const expectedLinks = 3;
    fixture.detectChanges();

    expect(links.length).toBe(expectedLinks);
    expect(links[0].linkParams).toBe(`/projects/${fakeProjects()[0].id}/overview`);
  });

  it('can click overview link in template', () => {
    fixture.detectChanges();
    const clustersLinkDe = linkDes[0];
    const clustersLink = links[0];
    expect(clustersLink.navigatedTo).toBeNull();

    click(clustersLinkDe);
    fixture.detectChanges();
    expect(clustersLink.navigatedTo).toBe(`/projects/${fakeProjects()[0].id}/overview`);
  });

  it('should correctly create router links', () => {
    fixture.detectChanges();
    expect(component.getRouterLink(View.Clusters)).toBe('/projects/' + fakeProjects()[0].id + '/clusters');
    expect(component.getRouterLink(View.Members)).toBe('/projects/' + fakeProjects()[0].id + '/members');
  });
});
