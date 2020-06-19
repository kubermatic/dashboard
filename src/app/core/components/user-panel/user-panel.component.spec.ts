import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, inject, TestBed} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';

import {SharedModule} from '../../../shared/shared.module';
import {AuthMockService} from '../../../testing/services/auth-mock.service';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {SettingsMockService} from '../../../testing/services/settings-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';
import {Auth, ProjectService, UserService} from '../../services/index';
import {SettingsService} from '../../services/settings/settings.service';
import {UserPanelComponent} from './user-panel.component';

const modules: any[] = [BrowserModule, HttpClientModule, RouterTestingModule, BrowserAnimationsModule, SharedModule];

describe('UserPanelComponent', () => {
  let fixture: ComponentFixture<UserPanelComponent>;
  let component: UserPanelComponent;
  let authService: AuthMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [UserPanelComponent],
      providers: [
        MatDialog,
        {provide: UserService, useClass: UserMockService},
        {provide: ProjectService, useClass: ProjectMockService},
        {provide: Auth, useClass: AuthMockService},
        {provide: SettingsService, useClass: SettingsMockService},
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserPanelComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should tell Router to navigate when user logout', inject([Router], (router: Router) => {
    authService = fixture.debugElement.injector.get(Auth) as any;
    const spyNavigate = jest.spyOn(router, 'navigate');
    const spyLogOut = jest.spyOn(authService, 'logout');

    component.logout();

    expect(spyNavigate).toHaveBeenCalled();
    expect(spyLogOut).toHaveBeenCalled();
  }));

  it('should not display user information after logout', async(() => {
    fixture.detectChanges();
    expect(component.user).toBeDefined();

    component.logout();
    expect(component.user).not.toBeDefined();
  }));
});
