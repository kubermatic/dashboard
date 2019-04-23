import {NgReduxTestingModule} from '@angular-redux/store/lib/testing/ng-redux-testing.module';
import {HttpClientModule} from '@angular/common/http';
import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';
import {SharedModule} from '../../../shared/shared.module';
import {fakeServiceAccountToken} from '../../../testing/fake-data/serviceaccount.fake';
import {RouterTestingModule} from '../../../testing/router-stubs';
import {TokenDialogComponent} from './token-dialog.component';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  RouterTestingModule,
  NgReduxTestingModule,
  SharedModule,
];

describe('TokenDialogComponent', () => {
  let component: TokenDialogComponent;
  let fixture: ComponentFixture<TokenDialogComponent>;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [TokenDialogComponent],
          providers: [
            {provide: MAT_DIALOG_DATA, useValue: {serviceaccountToken: fakeServiceAccountToken()}},
            {provide: MatDialogRef, useValue: {}},
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TokenDialogComponent);
    component = fixture.componentInstance;
    component.serviceaccountToken = fakeServiceAccountToken();

    fixture.detectChanges();
  });

  it('hould create the token dialog component', () => {
    expect(component).toBeTruthy();
  });
});
