import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitaloceanNodeComponent } from './digitalocean.component';

describe('DigitaloceanNodeComponent', () => {
  let component: DigitaloceanNodeComponent;
  let fixture: ComponentFixture<DigitaloceanNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DigitaloceanNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitaloceanNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
