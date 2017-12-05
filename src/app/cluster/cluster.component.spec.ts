/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import {MaterialModule} from '@angular/material';
import {FormBuilder, ReactiveFormsModule, FormsModule} from "@angular/forms";
import { ClusterComponent } from './cluster.component';
import { NodeComponent } from "./node/node.component";
import {HttpModule} from "@angular/http";
import {Auth} from "../core/services";
import {RouterTestingModule} from "@angular/router/testing";
import {AddNodeComponent} from "../forms/add-node/add-node.component";

describe('ClusterComponent', () => {
  let component: ClusterComponent;
  let fixture: ComponentFixture<ClusterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MaterialModule,
        ReactiveFormsModule,
        FormsModule,
        HttpModule,
        RouterTestingModule,
      ],
      declarations: [
        ClusterComponent,
        NodeComponent,
        AddNodeComponent,
      ],
      providers: [
        FormBuilder,
        Auth
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
