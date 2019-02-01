import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {ParticlesModule} from 'angular-particle';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {CookieService} from 'ngx-cookie-service';

import {Auth} from '../../core/services/index';
import {SharedModule} from '../../shared/shared.module';
import {RouterStub} from '../../testing/router-stubs';
import {AuthMockService} from '../../testing/services/auth-mock.service';

import {FrontpageComponent} from './frontpage.component';

const modules: any[] = [
  BrowserModule,
  RouterTestingModule,
  BrowserAnimationsModule,
  ParticlesModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('FrontpageComponent', () => {
  let fixture: ComponentFixture<FrontpageComponent>;
  let component: FrontpageComponent;
  let authService: AuthMockService;
  let router: Router;

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            FrontpageComponent,
          ],
          providers: [
            {provide: Router, useClass: RouterStub},
            {provide: Auth, useClass: AuthMockService},
            CookieService,
          ],
        })
        .compileComponents();
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

  it('should navigate to clusters list if not authenticated', () => {
    const spyNavigate = spyOn(router, 'navigate');
    authService.isAuth = true;

    fixture.detectChanges();

    expect(spyNavigate.and.callThrough()).toHaveBeenCalledTimes(1);
  });
});
