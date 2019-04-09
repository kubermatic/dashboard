import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {Router} from '@angular/router';
import {RouterTestingModule} from '@angular/router/testing';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {SharedModule} from '../../../shared/shared.module';
import {RouterStub} from '../../../testing/router-stubs';
import {AuthMockService} from '../../../testing/services/auth-mock.service';
import {ProjectMockService} from '../../../testing/services/project-mock.service';
import {UserMockService} from '../../../testing/services/user-mock.service';
import {Auth, ProjectService, UserService} from '../../services/index';
import {FooterComponent} from './footer.component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  RouterTestingModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;
  let component: FooterComponent;

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            FooterComponent,
          ],
          providers: [
            {provide: UserService, useClass: UserMockService},
            {provide: ProjectService, useClass: ProjectMockService},
            {provide: Router, useClass: RouterStub},
            {provide: Auth, useClass: AuthMockService},
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
  });

  it('should create the cmp', async(() => {
       expect(component).toBeTruthy();
     }));

  it('should show terms of service', async(() => {
       component.config = {show_terms_of_service: true};
       expect(component.showTermsOfService()).toBeTruthy();
     }));

  it('should hide terms of service', async(() => {
       expect(component.showTermsOfService()).toBeFalsy();
     }));

  it('should show demo system info', async(() => {
       component.config = {show_demo_info: true};
       expect(component.isDemoSystem()).toBeTruthy();
     }));

  it('should hide demo system info', async(() => {
       expect(component.isDemoSystem()).toBeFalsy();
     }));
});
