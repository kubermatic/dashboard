/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from "../../api/api.service";

import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "../../reducers/index";
import { AddNodeComponent } from './add-node.component';
import {HttpModule, ConnectionBackend} from "@angular/http";
import {Auth} from "../../auth/auth.service";
import {RouterTestingModule} from "@angular/router/testing";

describe('AddNodeComponent', () => {
  let component: AddNodeComponent;
  let fixture: ComponentFixture<AddNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddNodeComponent ],
      imports: [
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
        StoreModule.provideStore(combinedReducer),
        HttpModule,
        RouterTestingModule
      ],
      providers: [
        ApiService,
        ConnectionBackend,
        Auth
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
