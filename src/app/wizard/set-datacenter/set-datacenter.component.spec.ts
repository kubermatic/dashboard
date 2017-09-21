import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SetDatacenterComponent } from './set-datacenter.component';

describe('SetDatacenterComponent', () => {
  let component: SetDatacenterComponent;
  let fixture: ComponentFixture<SetDatacenterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SetDatacenterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SetDatacenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
