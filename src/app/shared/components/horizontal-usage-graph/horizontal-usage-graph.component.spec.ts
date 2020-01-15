import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {MatDialogRefMock} from '../../../testing/services/mat-dialog-ref-mock';
import {SharedModule} from '../../shared.module';

import {HorizontalUsageGraphComponent} from './horizontal-usage-graph.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
];

describe('HorizontalUsageGraphComponent', () => {
  let fixture: ComponentFixture<HorizontalUsageGraphComponent>;
  let component: HorizontalUsageGraphComponent;

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
    fixture = TestBed.createComponent(HorizontalUsageGraphComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', async(() => {
       expect(component).toBeTruthy();
     }));
});
