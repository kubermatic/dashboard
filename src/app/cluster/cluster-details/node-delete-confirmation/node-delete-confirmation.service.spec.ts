import { TestBed, inject } from '@angular/core/testing';

import { NodeDeleteConfirmationService } from './node-delete-confirmation.service';
import {MatDialog, Overlay, OverlayContainer, OverlayModule, MatDialogModule} from "@angular/material";
import {OverlayPositionBuilder} from "@angular/material/typings/core/overlay/position/overlay-position-builder";
import {BrowserModule} from "@angular/platform-browser";
import {HttpModule} from "@angular/http";
import {RouterTestingModule} from "@angular/router/testing";

describe('NodeDeleteConfirmationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpModule,
        RouterTestingModule,
        OverlayModule
      ],
      providers: [
        NodeDeleteConfirmationService,
        MatDialog,
        Overlay,
        OverlayContainer,
        MatDialogModule
      ]
    });
  });

  it('should be created', inject([NodeDeleteConfirmationService], (service: NodeDeleteConfirmationService) => {
    expect(service).toBeTruthy();
  }));
});
