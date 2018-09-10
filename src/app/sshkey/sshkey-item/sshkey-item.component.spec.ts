import { SharedModule } from '../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '../../testing/router-stubs';
import { Auth } from '../../core/services';
import { AuthMockService } from '../../testing/services/auth-mock.service';
import { SSHKeyItemComponent } from './sshkey-item.component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule
];

describe('SSHKeyItemComponent', () => {
  let fixture: ComponentFixture<SSHKeyItemComponent>;
  let component: SSHKeyItemComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        SSHKeyItemComponent,
      ],
      providers: [
        { provide: Auth, useClass: AuthMockService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SSHKeyItemComponent);
    component = fixture.componentInstance;
  });
});
