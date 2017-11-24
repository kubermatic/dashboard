/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {FormBuilder, ReactiveFormsModule, FormsModule} from "@angular/forms";
import {StoreModule} from "@ngrx/store";
import { NgModule } from "@angular/core";
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import {RouterTestingModule} from "@angular/router/testing";
import {MaterialModule, MdDialogRef} from '@angular/material';
import { RouterModule, Router } from "@angular/router";
import { ClusterDeleteConfirmationComponent } from './cluster-delete-confirmation.component';
import {ApiService} from "app/core/services/api/api.service";
import {HttpModule} from "@angular/http";
import {combinedReducer} from "../../redux/reducers/index";



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
        StoreModule.provideStore(combinedReducer),
        HttpModule,
        MaterialModule,
        RouterModule
      ],
      providers: [
        Router,
        ApiService,
        FormBuilder,
        MdDialogRef
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
