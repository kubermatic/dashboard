import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule, RouterLinkStubDirective, RouterStub, ActivatedRouteStub } from '../../../testing/router-stubs';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { click } from './../../../testing/utils/click-handler';

import { SidenavComponent } from './sidenav.component';
import { DebugElement } from '@angular/core/src/debug/debug_node';
import { ApiService, ProjectService } from './../../../core/services';
import { fakeProjects } from './../../../testing/fake-data/project.fake';
import { asyncData } from './../../../testing/services/api-mock.service';
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
    getProjectsSpy = apiMock.getProjects.and.returnValue(asyncData(fakeProjects));

    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        SidenavComponent
      ],
      providers: [
        ProjectService,
        { provide: ApiService, useValue: apiMock },
        { provide: Router, useValue: {
          routerState: {
            snapshot: {
              url: [{ path: 1 }, { path: 2 }]}
            }
          }
        }
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
