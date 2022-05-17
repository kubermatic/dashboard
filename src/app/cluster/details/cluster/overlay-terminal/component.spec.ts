import {ComponentFixture, TestBed} from '@angular/core/testing';

import {OverlayTerminalComponent} from './component';

describe('OverlayTerminalComponent', () => {
  let component: OverlayTerminalComponent;
  let fixture: ComponentFixture<OverlayTerminalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [OverlayTerminalComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverlayTerminalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
