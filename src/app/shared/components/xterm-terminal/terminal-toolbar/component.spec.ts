import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TerminalToolBarComponent} from './component';

describe('TerminalToolBarComponent', () => {
  let component: TerminalToolBarComponent;
  let fixture: ComponentFixture<TerminalToolBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TerminalToolBarComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TerminalToolBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
