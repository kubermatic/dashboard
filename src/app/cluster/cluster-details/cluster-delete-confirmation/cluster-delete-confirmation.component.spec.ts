/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {FormBuilder, ReactiveFormsModule, FormsModule} from "@angular/forms";
import { NgModule } from "@angular/core";
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import {RouterTestingModule} from "@angular/router/testing";
import {MaterialModule, MatDialogRef} from '@angular/material';
import { RouterModule, Router } from "@angular/router";
import { ClusterDeleteConfirmationComponent } from './cluster-delete-confirmation.component';
import {ApiService} from "app/core/services/api/api.service";
import {HttpModule} from "@angular/http";



describe('ClusterDeleteConfirmationComponent', () => {
  let component: ClusterDeleteConfirmationComponent;
  let fixture: ComponentFixture<ClusterDeleteConfirmationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClusterDeleteConfirmationComponent ],
      imports: [
        FormsModule,
        ReactiveFormsModule,
        RouterTestingModule,
        HttpModule,
        MaterialModule,
        RouterModule
      ],
      providers: [
        Router,
        ApiService,
        FormBuilder,
        MatDialogRef
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterDeleteConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
