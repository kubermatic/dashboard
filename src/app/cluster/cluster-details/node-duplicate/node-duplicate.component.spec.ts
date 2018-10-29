import { SharedModule } from '../../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SlimLoadingBarModule } from 'ng2-slim-loading-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MatDialogRefMock } from './../../../testing/services/mat-dialog-ref-mock';
import { ApiService } from '../../../core/services/api/api.service';
import { ApiMockService } from '../../../testing/services/api-mock.service';
import { MatDialogRef } from '@angular/material';
import { NodeDuplicateComponent } from './node-duplicate.component';
import { GoogleAnalyticsService } from '../../../google-analytics.service';

const modules: any[] = [
  BrowserModule,
  HttpClientModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule
];

describe('NodeDuplicateComponent', () => {
  let fixture: ComponentFixture<NodeDuplicateComponent>;
  let component: NodeDuplicateComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...modules,
      ],
      declarations: [
        NodeDuplicateComponent
      ],
      providers: [
        { provide: MatDialogRef, useClass: MatDialogRefMock },
        { provide: ApiService, useClass: ApiMockService },
        GoogleAnalyticsService
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeDuplicateComponent);
    component = fixture.componentInstance;
  });

  it('should create the duplicate node cmp', async(() => {
    expect(component).toBeTruthy();
  }));
});
