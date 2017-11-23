import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSshKeyComponent } from './add-ssh-key.component';
import { MaterialModule } from '@angular/material';

import {FormBuilder, ReactiveFormsModule, FormsModule} from "@angular/forms";
import {HttpModule, BaseRequestOptions, Http, XHRBackend, Response, ResponseOptions} from "@angular/http";
import {RouterTestingModule} from "@angular/router/testing";
import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "../../reducers/index";

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {Auth} from "../../core/services";
import {ApiService} from "../../api/api.service";

describe('AddSshKeyComponent', () => {
  let component: AddSshKeyComponent;
  let fixture: ComponentFixture<AddSshKeyComponent>;

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
      declarations: [ AddSshKeyComponent ],
      providers: [
        FormBuilder,
        ApiService,
        Auth
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSshKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
