import { HttpClientModule } from '@angular/common/http';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DebugElement } from '@angular/core/src/debug/debug_node';
import { MatDialog } from '@angular/material';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { MockComponent } from 'ng2-mock-component';

import { SidenavComponent } from './sidenav.component';

import { ApiService, ProjectService, UserService } from './../../../core/services';
import { AppConfigService } from '../../../app-config.service';

import { SharedModule } from '../../../shared/shared.module';
import { RouterTestingModule, RouterLinkStubDirective, RouterStub } from '../../../testing/router-stubs';
import { click } from './../../../testing/utils/click-handler';

import { asyncData } from './../../../testing/services/api-mock.service';
import { ProjectMockService } from './../../../testing/services/project-mock.service';
import { UserMockService } from './../../../testing/services/user-mock.service';
import { AppConfigMockService } from './../../../testing/services/app-config-mock.service';

import { fakeProjects } from './../../../testing/fake-data/project.fake';
import { fakeUserGroupConfig } from './../../../testing/fake-data/userGroupConfig.fake';
import Spy = jasmine.Spy;

const modules: any[] = [
  BrowserModule,
  RouterTestingModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('SidenavComponent', () => {
  let fixture: ComponentFixture<SidenavComponent>;
  let component: SidenavComponent;
  let linkDes: DebugElement[];
  let links: RouterLinkStubDirective[];
  let getProjectsSpy: Spy;

  beforeEach(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['getProjects']);
    getProjectsSpy = apiMock.getProjects.and.returnValue(asyncData(fakeProjects()));

    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        SidenavComponent,
        MockComponent({
          selector: 'a',
          inputs: [ 'routerLink', 'routerLinkActiveOptions' ]
        }),
      ],
      providers: [
        { provide: ApiService, useValue: apiMock },
        { provide: ProjectService, useClass: ProjectMockService },
        { provide: UserService, useClass: UserMockService },
        { provide: AppConfigService, useClass: AppConfigMockService },
        { provide: Router, useValue: {
          routerState: {
            snapshot: {
              url: [{ path: 1 }, { path: 2 }]}
            }
          }
        },
        MatDialog,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SidenavComponent);
    component = fixture.componentInstance;
    linkDes = fixture.debugElement
      .queryAll(By.directive(RouterLinkStubDirective));

    links = linkDes
      .map(de => de.injector.get(RouterLinkStubDirective) as RouterLinkStubDirective);
  });

  it('should create the sidenav cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should get RouterLinks from template', () => {
    fixture.detectChanges();

    expect(links.length).toBe(5, 'should have 5 links');
    expect(links[0].linkParams).toBe('/projects//wizard', '1st link should go to Wizard');
  });

  it('can click Wizard link in template', () => {
    fixture.detectChanges();

    const wizardLinkDe = linkDes[0];
    const wizardLink = links[0];

    expect(wizardLink.navigatedTo).toBeNull('link should not have navigated yet');

    click(wizardLinkDe);
    fixture.detectChanges();

    expect(wizardLink.navigatedTo).toBe('/projects//wizard');
  });

});
