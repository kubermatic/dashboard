import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingFormDoComponent } from './setting-form-do.component';

describe('SettingFormDoComponent', () => {
  let component: SettingFormDoComponent;
  let fixture: ComponentFixture<SettingFormDoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingFormDoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingFormDoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
