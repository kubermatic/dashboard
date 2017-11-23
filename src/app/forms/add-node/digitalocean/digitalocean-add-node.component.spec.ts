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
import {DigitaloceanAddNodeComponent} from "./digitalocean-add-node.component";

describe('AddNodeComponent', () => {
  let component: DigitaloceanAddNodeComponent;
  let fixture: ComponentFixture<DigitaloceanAddNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DigitaloceanAddNodeComponent ],
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
    fixture = TestBed.createComponent(DigitaloceanAddNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
