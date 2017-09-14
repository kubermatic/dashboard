import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BareMetalNodeComponent } from './bare-metal.component';

describe('BareMetalNodeComponent', () => {
  let component: BareMetalNodeComponent;
  let fixture: ComponentFixture<BareMetalNodeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BareMetalNodeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BareMetalNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
