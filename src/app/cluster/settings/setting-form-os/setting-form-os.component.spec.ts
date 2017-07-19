import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingFormOsComponent } from './setting-form-os.component';

describe('SettingFormOsComponent', () => {
  let component: SettingFormOsComponent;
  let fixture: ComponentFixture<SettingFormOsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingFormOsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingFormOsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
