import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerminalToolbarComponent } from './terminal-toolbar.component';

describe('TerminalToolbarComponent', () => {
  let component: TerminalToolbarComponent;
  let fixture: ComponentFixture<TerminalToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TerminalToolbarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TerminalToolbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
