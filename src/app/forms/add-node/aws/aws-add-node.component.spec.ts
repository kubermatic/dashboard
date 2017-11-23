/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { MaterialModule } from '@angular/material';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from "../../../api/api.service";

import {StoreModule} from "@ngrx/store";
import {combinedReducer} from "../../../redux/reducers/index";
import {HttpModule, ConnectionBackend} from "@angular/http";
import {Auth} from "../../../core/services";
import {RouterTestingModule} from "@angular/router/testing";
import {AWSAddNodeFormComponent} from "./aws-add-node.component";

describe('AddNodeComponent', () => {
  let component: AWSAddNodeFormComponent;
  let fixture: ComponentFixture<AWSAddNodeFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AWSAddNodeFormComponent ],
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
    fixture = TestBed.createComponent(AWSAddNodeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
