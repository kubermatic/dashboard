import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSshKeyComponent } from './add-ssh-key.component';

describe('AddSshKeyComponent', () => {
  let component: AddSshKeyComponent;
  let fixture: ComponentFixture<AddSshKeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddSshKeyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSshKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
