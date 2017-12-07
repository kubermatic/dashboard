import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNodeFormComponent } from './add-node-form.component';

describe('FormComponent', () => {
  let component: AddNodeFormComponent;
  let fixture: ComponentFixture<AddNodeFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddNodeFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNodeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
