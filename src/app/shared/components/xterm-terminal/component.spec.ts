import {ComponentFixture, TestBed} from '@angular/core/testing';

import {XTermTerminal} from './component';

describe('XTermTerminal', () => {
  let component: XTermTerminal;
  let fixture: ComponentFixture<XTermTerminal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [XTermTerminal],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(XTermTerminal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
