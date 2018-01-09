import { TestBed, inject } from '@angular/core/testing';

import { NodeDeleteConfirmationService } from './node-delete-confirmation.service';
import {MatDialog, MatDialogModule} from '@angular/material';
import {BrowserModule} from '@angular/platform-browser';
import {HttpModule} from '@angular/http';
import {RouterTestingModule} from '@angular/router/testing';

describe('NodeDeleteConfirmationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpModule,
        RouterTestingModule
      ],
      providers: [
        NodeDeleteConfirmationService,
        MatDialog,
        MatDialogModule
      ]
    });
  });

  it('should be created', inject([NodeDeleteConfirmationService], (service: NodeDeleteConfirmationService) => {
    expect(service).toBeTruthy();
  }));
});
