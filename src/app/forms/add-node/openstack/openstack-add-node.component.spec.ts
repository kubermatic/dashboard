/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from "app/core/services/api/api.service";

import {HttpModule, ConnectionBackend} from "@angular/http";
import {Auth} from "../../../core/services";
import {RouterTestingModule} from "@angular/router/testing";
import {OpenstackAddNodeComponent} from "./openstack-add-node.component";

describe('AddNodeComponent', () => {
  let component: OpenstackAddNodeComponent;
  let fixture: ComponentFixture<OpenstackAddNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OpenstackAddNodeComponent ],
      imports: [
        MaterialModule,
        FormsModule,
        ReactiveFormsModule,
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
    fixture = TestBed.createComponent(OpenstackAddNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
