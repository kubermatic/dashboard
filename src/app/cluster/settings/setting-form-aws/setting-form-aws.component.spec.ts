import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingFormAwsComponent } from './setting-form-aws.component';

describe('SettingFormAwsComponent', () => {
  let component: SettingFormAwsComponent;
  let fixture: ComponentFixture<SettingFormAwsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettingFormAwsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettingFormAwsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
