import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListSshKeyComponent } from './list-ssh-key.component';

describe('ListSshKeyComponent', () => {
  let component: ListSshKeyComponent;
  let fixture: ComponentFixture<ListSshKeyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListSshKeyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListSshKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
