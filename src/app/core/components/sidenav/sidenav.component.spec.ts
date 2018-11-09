import { HttpClientModule } from '@angular/common/http';
import { DebugElement } from '@angular/core/src/debug/debug_node';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { MockComponent } from 'ng2-mock-component';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { AppConfigService } from '../../../app-config.service';
import { ProjectEntity } from '../../../shared/entity/ProjectEntity';
import { SharedModule } from '../../../shared/shared.module';
import { fakeProjects } from '../../../testing/fake-data/project.fake';
import { RouterLinkStubDirective, RouterTestingModule } from '../../../testing/router-stubs';
import { asyncData } from '../../../testing/services/api-mock.service';
import { AppConfigMockService } from '../../../testing/services/app-config-mock.service';
import { ProjectMockService } from '../../../testing/services/project-mock.service';
import { UserMockService } from '../../../testing/services/user-mock.service';
import { click } from '../../../testing/utils/click-handler';
import { ApiService, ProjectService, UserService } from '../../services';
import { SidenavComponent } from './sidenav.component';

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

    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        SidenavComponent,
        MockComponent({
          selector: 'a',
          inputs: [ 'routerLink', 'routerLinkActiveOptions' ],
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
              url: [{ path: 1 }, { path: 2 }]},
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
    linkDes = fixture.debugElement
      .queryAll(By.directive(RouterLinkStubDirective));

    links = linkDes
      .map((de) => de.injector.get(RouterLinkStubDirective) as RouterLinkStubDirective);
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

  it('should correctly compare projects basing on their IDs', () => {
     const a: ProjectEntity =  {
      id: '1',
      name: 'first',
      creationTimestamp: undefined,
      deletionTimestamp: undefined,
      status: '',
    };
     const b: ProjectEntity =  {
      id: '2',
      name: 'second',
      creationTimestamp: undefined,
      deletionTimestamp: undefined,
      status: '',
    };
     expect(component.compareProjectsEquality(a, b)).toBeFalsy();
     expect(component.compareProjectsEquality(b, a)).toBeFalsy();

     b.id = a.id;
     expect(component.compareProjectsEquality(a, b)).toBeTruthy();
     expect(component.compareProjectsEquality(b, a)).toBeTruthy();
  });

  it('should correctly create router links', () => {
    component.selectedProject = {
      id: '1',
      name: 'first',
      creationTimestamp: undefined,
      deletionTimestamp: undefined,
      status: '',
    };
    expect(component.getRouterLink('clusters')).toBe('/projects/1/clusters');
    expect(component.getRouterLink('members')).toBe('/projects/1/members');

    component.selectedProject.id = '2';
    expect(component.getRouterLink('clusters')).toBe('/projects/2/clusters');
    expect(component.getRouterLink('members')).toBe('/projects/2/members');
  });
});
