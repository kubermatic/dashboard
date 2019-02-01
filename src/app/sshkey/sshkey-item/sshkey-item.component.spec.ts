import {HttpClientModule} from '@angular/common/http';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {of} from 'rxjs';
import {ApiService, Auth} from '../../core/services';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {SharedModule} from '../../shared/shared.module';
import {RouterTestingModule} from '../../testing/router-stubs';
import {AuthMockService} from '../../testing/services/auth-mock.service';
import {SSHKeyItemComponent} from './sshkey-item.component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule,
];

describe('SSHKeyItemComponent', () => {
  let fixture: ComponentFixture<SSHKeyItemComponent>;
  let component: SSHKeyItemComponent;

  beforeEach(() => {
    const apiMock = jasmine.createSpyObj('ApiService', ['deleteSSHKey']);
    apiMock.deleteSSHKey.and.returnValue(of(null));

    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            SSHKeyItemComponent,
          ],
          providers: [
            {provide: Auth, useClass: AuthMockService},
            {provide: ApiService, useValue: apiMock},
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SSHKeyItemComponent);
    component = fixture.componentInstance;
  });

  it('should create sshkey item cmp', () => {
    expect(component).toBeTruthy();
  });
});
