import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {MatDialogRefMock} from '../../../testing/services/mat-dialog-ref-mock';
import {SharedModule} from '../../shared.module';

import {ConfirmationDialogComponent} from './confirmation-dialog.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
];

describe('ConfirmationDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  let component: ConfirmationDialogComponent;

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [...modules],
          providers: [
            {provide: MatDialogRef, useClass: MatDialogRefMock},
            {provide: MAT_DIALOG_DATA, useValue: {}},
          ],
        })
        .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', async(() => {
       expect(component).toBeTruthy();
     }));
});
