import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetProviderComponent } from './set-provider.component';

describe('SetProviderComponent', () => {
  let component: SetProviderComponent;
  let fixture: ComponentFixture<SetProviderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetProviderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetProviderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
