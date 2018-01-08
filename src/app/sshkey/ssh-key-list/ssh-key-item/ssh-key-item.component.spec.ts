import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SshKeyItemComponent } from './ssh-key-item.component';

describe('SshKeyItemComponent', () => {
  let component: SshKeyItemComponent;
  let fixture: ComponentFixture<SshKeyItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SshKeyItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SshKeyItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
