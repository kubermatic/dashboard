import { TestBed, inject } from '@angular/core/testing';

import { NodeDeleteConfirmationService } from './node-delete-confirmation.service';
import {MdDialog, Overlay, OverlayContainer, OverlayModule, MdDialogModule} from "@angular/material";
import {OverlayPositionBuilder} from "@angular/material/typings/core/overlay/position/overlay-position-builder";
import {BrowserModule} from "@angular/platform-browser";
import {HttpModule} from "@angular/http";
import {RouterTestingModule} from "@angular/router/testing";
import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "../../reducers/index";

describe('NodeDeleteConfirmationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpModule,
        RouterTestingModule,
        StoreModule.provideStore(combinedReducer),
        OverlayModule
      ],
      providers: [
        NodeDeleteConfirmationService,
        MdDialog,
        Overlay,
        OverlayContainer,
        MdDialogModule
      ]
    });
  });

  it('should be created', inject([NodeDeleteConfirmationService], (service: NodeDeleteConfirmationService) => {
    expect(service).toBeTruthy();
  }));
});
