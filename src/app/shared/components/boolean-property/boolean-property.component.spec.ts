import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {MatDialogRefMock} from '../../../testing/services/mat-dialog-ref-mock';
import {SharedModule} from '../../shared.module';

import {BooleanPropertyComponent} from './boolean-property.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
];

describe('BooleanPropertyComponent', () => {
  let fixture: ComponentFixture<BooleanPropertyComponent>;
  let component: BooleanPropertyComponent;

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
    fixture = TestBed.createComponent(BooleanPropertyComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', async(() => {
       expect(component).toBeTruthy();
     }));
});
