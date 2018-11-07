import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { Auth } from '../../core/services';
import { SharedModule } from '../../shared/shared.module';
import { RouterTestingModule } from '../../testing/router-stubs';
import { AuthMockService } from '../../testing/services/auth-mock.service';
import { SSHKeyItemComponent } from './sshkey-item.component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  SharedModule,
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
