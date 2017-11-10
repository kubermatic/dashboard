import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetSettingsComponent } from './set-settings.component';

describe('SetSettingsComponent', () => {
  let component: SetSettingsComponent;
  let fixture: ComponentFixture<SetSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
