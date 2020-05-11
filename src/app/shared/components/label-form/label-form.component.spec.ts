import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {SharedModule} from '../../shared.module';
import {LabelFormComponent} from './label-form.component';

describe('LabelFormComponent', () => {
  let fixture: ComponentFixture<LabelFormComponent>;
  let component: LabelFormComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, SharedModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LabelFormComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize labels object', () => {
    expect(component.labels).toBeUndefined();

    component.ngOnInit();

    expect(component.labels).not.toBeUndefined();
  });

  it('should delete labels with nullify', () => {
    expect(component.labels).toBeUndefined();

    component.labels = {
      env: 'test',
    };
    component.ngOnInit();
    component.deleteLabel(0);

    expect(component.labels).toEqual({env: null});
  });

  it('should delete labels without nullify', () => {
    expect(component.labels).toBeUndefined();

    component.labels = {
      env: 'test',
    };
    component.ngOnInit();
    component.initialLabels = {};
    component.deleteLabel(0);

    expect(component.labels).toEqual({});
  });
});
