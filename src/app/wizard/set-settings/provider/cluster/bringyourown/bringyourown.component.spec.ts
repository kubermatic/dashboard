import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BringyourownClusterComponent } from './bringyourown.component';

describe('BringyourownClusterComponent', () => {
  let component: BringyourownClusterComponent;
  let fixture: ComponentFixture<BringyourownClusterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BringyourownClusterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BringyourownClusterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
