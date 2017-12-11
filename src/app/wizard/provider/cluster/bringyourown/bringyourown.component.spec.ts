import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BringyourownComponent } from './bringyourown.component';

describe('BringyourownComponent', () => {
  let component: BringyourownComponent;
  let fixture: ComponentFixture<BringyourownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BringyourownComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BringyourownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
