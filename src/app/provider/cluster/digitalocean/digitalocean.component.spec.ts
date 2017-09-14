import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitaloceanClusterComponent } from './digitalocean.component';

describe('DigitaloceanClusterComponent', () => {
  let component: DigitaloceanClusterComponent;
  let fixture: ComponentFixture<DigitaloceanClusterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DigitaloceanClusterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DigitaloceanClusterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
