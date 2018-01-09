/* tslint:disable:no-unused-variable */
import { NgModule } from '@angular/core';

import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material';
import { NodeDeleteConfirmationComponent } from './node-delete-confirmation.component';
import {ConnectionBackend, RequestOptions, HttpModule} from "@angular/http";
import {Auth} from "../../core/services";
import {RouterTestingModule} from "@angular/router/testing";
import {FormBuilder, NgModel} from "@angular/forms";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ApiService} from "app/core/services/api/api.service";

describe('NodeDeleteConfirmationComponent', () => {
  let component: NodeDeleteConfirmationComponent;
  let fixture: ComponentFixture<NodeDeleteConfirmationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodeDeleteConfirmationComponent ],
      imports: [
        HttpModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        MatDialogModule
      ],
      providers: [
        ConnectionBackend,
        Auth,
        FormBuilder,
        ApiService,
        MatDialogModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeDeleteConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
