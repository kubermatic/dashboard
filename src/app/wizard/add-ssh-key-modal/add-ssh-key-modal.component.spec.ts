import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSshKeyModalComponent } from './add-ssh-key-modal.component';

import {MaterialModule} from '@angular/material';

import {FormBuilder, ReactiveFormsModule, FormsModule} from "@angular/forms";
import {HttpModule, BaseRequestOptions, Http, XHRBackend, Response, ResponseOptions} from "@angular/http";
import {RouterTestingModule} from "@angular/router/testing";
import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "../../reducers/index";

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {Auth} from "../../auth/auth.service";
import {ApiService} from "../../api/api.service";

describe('AddSshKeyModalComponent', () => {
  let component: AddSshKeyModalComponent;
  let fixture: ComponentFixture<AddSshKeyModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        ReactiveFormsModule,
        FormsModule,
        HttpModule,
        RouterTestingModule,
        StoreModule.provideStore(combinedReducer),
        MaterialModule
      ],
      declarations: [ AddSshKeyModalComponent ],
      providers: [
        FormBuilder,
        ApiService,
        Auth
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSshKeyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
