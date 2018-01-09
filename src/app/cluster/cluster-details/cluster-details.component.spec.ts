/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import {FormBuilder, ReactiveFormsModule, FormsModule} from '@angular/forms';
import { ClusterDetailsComponent } from './cluster-details.component';
import { NodeComponent } from './node/node.component';
import {Auth} from '../../core/services';
import {RouterTestingModule} from '@angular/router/testing';

describe('ClusterComponent', () => {
  let component: ClusterDetailsComponent;
  let fixture: ComponentFixture<ClusterDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        FormsModule,
        RouterTestingModule
      ],
      declarations: [
        ClusterDetailsComponent,
        NodeComponent
      ],
      providers: [
        FormBuilder,
        Auth
      ],
      exports: [
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClusterDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
