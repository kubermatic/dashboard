import { SharedModule } from '../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
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
    TestBed.createComponent(SSHKeyItemComponent);
  });
});
