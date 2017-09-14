import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BareMetalClusterComponent } from './bare-metal.component';

describe('BareMetalClusterComponent', () => {
  let component: BareMetalClusterComponent;
  let fixture: ComponentFixture<BareMetalClusterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BareMetalClusterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BareMetalClusterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
