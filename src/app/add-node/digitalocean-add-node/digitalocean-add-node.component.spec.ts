import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitaloceanAddNodeComponent } from './digitalocean-add-node.component';

describe('DigitaloceanAddNodeComponent', () => {
  let component: DigitaloceanAddNodeComponent;
  let fixture: ComponentFixture<DigitaloceanAddNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DigitaloceanAddNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitaloceanAddNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
