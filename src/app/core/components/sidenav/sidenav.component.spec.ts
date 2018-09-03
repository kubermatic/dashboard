import { HttpClientModule } from '@angular/common/http';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { DebugElement } from '@angular/core/src/debug/debug_node';
import { MatDialog } from '@angular/material';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';

import { SidenavComponent } from './sidenav.component';

import { ApiService, ProjectService, UserService } from './../../../core/services';
import { AppConfigService } from '../../../app-config.service';

import { SharedModule } from '../../../shared/shared.module';
import { RouterTestingModule, RouterLinkStubDirective, RouterStub, ActivatedRouteStub } from '../../../testing/router-stubs';
import { click } from './../../../testing/utils/click-handler';

import { asyncData } from './../../../testing/services/api-mock.service';
import { ProjectMockService } from './../../../testing/services/project-mock.service';
import { UserMockService } from './../../../testing/services/user-mock.service';
import { AppConfigMockService } from './../../../testing/services/app-config-mock.service';

import { fakeProjects } from './../../../testing/fake-data/project.fake';
import Spy = jasmine.Spy;

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
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
        SidenavComponent
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

    expect(links.length).toBe(4, 'should have 3 links');
    expect(links.length).toBe(5, 'should have 5 links');
    expect(links[0].linkParams).toBe('/wizard', '1st link should go to Wizard');
    expect(links[1].linkParams).toBe('/clusters', '2nd link should go to Cluster list');
  });

  it('can click Wizard link in template', () => {
    fixture.detectChanges();

    const wizardLinkDe = linkDes[0];
    const wizardLink = links[0];

    expect(wizardLink.navigatedTo).toBeNull('link should not have navigated yet');

    click(wizardLinkDe);
    fixture.detectChanges();

    expect(wizardLink.navigatedTo).toBe('/wizard');
  });

});
