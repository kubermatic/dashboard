/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { NodeGroupComponent } from './node-group.component';

describe('NodeGroupComponent', () => {
  let component: NodeGroupComponent;
  let fixture: ComponentFixture<NodeGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NodeGroupComponent ],
      imports: [
      ],
      providers: [
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NodeGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
