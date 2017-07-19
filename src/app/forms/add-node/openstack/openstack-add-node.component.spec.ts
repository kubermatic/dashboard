/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from "../../../api/api.service";

import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "../../../reducers/index";
import {HttpModule, ConnectionBackend} from "@angular/http";
import {Auth} from "../../../auth/auth.service";
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
    fixture = TestBed.createComponent(OpenstackAddNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
