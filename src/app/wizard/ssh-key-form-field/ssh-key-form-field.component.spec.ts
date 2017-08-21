import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SshKeyFormFieldComponent } from './ssh-key-form-field.component';

describe('SshKeyFormFieldComponent', () => {
  let component: SshKeyFormFieldComponent;
  let fixture: ComponentFixture<SshKeyFormFieldComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SshKeyFormFieldComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SshKeyFormFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
