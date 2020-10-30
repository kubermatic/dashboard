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

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {BrowserModule, By} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {RouterStub} from '@app/testing/router-stubs';
import {AuthMockService} from '@app/testing/services/auth-mock.service';
import {click} from '@app/testing/utils/click-handler';
import {Auth} from '@core/services/auth/service';
import {SharedModule} from '@shared/shared.module';
import {PageNotFoundComponent} from './page-not-found.component';

const modules: any[] = [BrowserModule, RouterTestingModule, BrowserAnimationsModule, SharedModule];

describe('PageNotFoundComponent', () => {
  let fixture: ComponentFixture<PageNotFoundComponent>;
  let component: PageNotFoundComponent;
  let authService: AuthMockService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [PageNotFoundComponent],
      providers: [
        {provide: Router, useClass: RouterStub},
        {provide: Auth, useClass: AuthMockService},
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageNotFoundComponent);
    component = fixture.componentInstance;

    authService = fixture.debugElement.injector.get(Auth) as any;
    router = fixture.debugElement.injector.get(Router);
  });

  it(
    'should create the cmp',
    waitForAsync(() => {
      expect(component).toBeTruthy();
    })
  );

  it('should navigate to clusters list', () => {
    const spyNavigate = jest.spyOn(router, 'navigate');
    authService.isAuth = true;

    fixture.detectChanges();
    const deButton = fixture.debugElement.query(By.css('button'));
    click(deButton);

    const navArgs = spyNavigate.mock.calls[0][0];
    expect(spyNavigate).toHaveBeenCalledTimes(1);
    expect(navArgs[0]).toBe('/projects');
  });

  it('should navigate to the front apge', () => {
    const spyNavigate = jest.spyOn(router, 'navigate');
    authService.isAuth = false;

    fixture.detectChanges();
    const deButton = fixture.debugElement.query(By.css('button'));
    click(deButton);

    const navArgs = spyNavigate.mock.calls[0][0];
    expect(spyNavigate).toHaveBeenCalledTimes(1);
    expect(navArgs[0]).toBe('');
  });
});
