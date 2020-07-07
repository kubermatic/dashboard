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

import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {CookieService} from 'ngx-cookie-service';

import {Auth} from '../../core/services';
import {SharedModule} from '../../shared/shared.module';
import {RouterStub} from '../../testing/router-stubs';
import {AuthMockService} from '../../testing/services/auth-mock.service';

import {FrontpageComponent} from './frontpage.component';

const modules: any[] = [BrowserModule, RouterTestingModule, BrowserAnimationsModule, SharedModule];

describe('FrontpageComponent', () => {
  let fixture: ComponentFixture<FrontpageComponent>;
  let component: FrontpageComponent;
  let authService: AuthMockService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...modules],
      declarations: [FrontpageComponent],
      providers: [{provide: Router, useClass: RouterStub}, {provide: Auth, useClass: AuthMockService}, CookieService],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FrontpageComponent);
    component = fixture.componentInstance;

    authService = fixture.debugElement.injector.get(Auth) as any;
    router = fixture.debugElement.injector.get(Router);
  });

  it('should create the cmp', async(() => {
    expect(component).toBeTruthy();
  }));

  it('should navigate to clusters list if authenticated', () => {
    const spyNavigate = jest.spyOn(router, 'navigate');
    authService.isAuth = true;

    fixture.detectChanges();

    expect(spyNavigate).toHaveBeenCalledTimes(1);
  });
});
