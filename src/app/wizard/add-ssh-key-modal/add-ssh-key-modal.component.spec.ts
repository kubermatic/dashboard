import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSshKeyModalComponent } from './add-ssh-key-modal.component';

describe('AddSshKeyModalComponent', () => {
  let component: AddSshKeyModalComponent;
  let fixture: ComponentFixture<AddSshKeyModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddSshKeyModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSshKeyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
