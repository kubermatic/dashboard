import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {FormBuilder,} from "@angular/forms";
import { ListSshKeyComponent } from './list-ssh-key.component';
import {Auth} from "../../core/services";
import {ApiService} from "app/core/services/api/api.service";
import {BrowserModule} from "@angular/platform-browser";
import {HttpModule} from "@angular/http";
import {RouterTestingModule} from "@angular/router/testing";

describe('ListSshKeyComponent', () => {
  let component: ListSshKeyComponent;
  let fixture: ComponentFixture<ListSshKeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        HttpModule,
        RouterTestingModule
      ],
      declarations: [ ListSshKeyComponent ],
      providers: [
        Auth,
        ApiService,
        FormBuilder
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListSshKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
