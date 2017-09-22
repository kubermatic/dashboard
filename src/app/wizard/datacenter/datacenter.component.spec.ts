import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DatacenterComponent } from './datacenter.component';

describe('DatacenterComponent', () => {
  let component: DatacenterComponent;
  let fixture: ComponentFixture<DatacenterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DatacenterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DatacenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
