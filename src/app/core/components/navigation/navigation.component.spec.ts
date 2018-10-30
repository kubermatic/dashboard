import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { SharedModule } from '../../../shared/shared.module';
import { AuthMockService } from '../../../testing/services/auth-mock.service';
import { ProjectMockService } from '../../../testing/services/project-mock.service';
import { UserMockService } from '../../../testing/services/user-mock.service';
import { Auth, ProjectService, UserService } from '../../services/index';
import { SidenavService } from '../sidenav/sidenav.service';
import { RouterStub } from './../../../testing/router-stubs';
import { NavigationComponent } from './navigation.component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  RouterTestingModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('NavigationComponent', () => {
  let fixture: ComponentFixture<NavigationComponent>;
  let component: NavigationComponent;
  let authService: AuthMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        NavigationComponent
      ],
      providers: [
        SidenavService,
        MatDialog,
        { provide: UserService, useClass: UserMockService },
        { provide: ProjectService, useClass: ProjectMockService },
        { provide: Router, useClass: RouterStub },
        { provide: Auth, useClass: AuthMockService }
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NavigationComponent);
    component = fixture.componentInstance;
  });

  it('should create the cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should tell Router to navigate when user logout',
    inject([Router], (router: Router) => {
      authService = fixture.debugElement.injector.get(Auth) as any;
      const spyNavigate = spyOn(router, 'navigate');
      const spyLogOut = spyOn(authService, 'logout');

      component.logout();

      expect(spyNavigate).toHaveBeenCalled();
      expect(spyLogOut).toHaveBeenCalled();
    }));
});
