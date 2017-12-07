import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNodeModalComponent } from './add-node-modal.component';

describe('AddNodeModalComponent', () => {
  let component: AddNodeModalComponent;
  let fixture: ComponentFixture<AddNodeModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddNodeModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddNodeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
