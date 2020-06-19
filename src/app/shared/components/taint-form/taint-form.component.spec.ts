import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {Taint} from '../../entity/node';
import {SharedModule} from '../../shared.module';

import {TaintFormComponent} from './taint-form.component';

describe('TaintFormComponent', () => {
  let fixture: ComponentFixture<TaintFormComponent>;
  let component: TaintFormComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule, BrowserAnimationsModule, SharedModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TaintFormComponent);
    component = fixture.componentInstance;
  });

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize taints object', () => {
    expect(component.taints).toBeUndefined();

    component.ngOnInit();

    expect(component.taints).not.toBeUndefined();
  });

  it('should delete labels', () => {
    expect(component.taints).toBeUndefined();

    component.taints = [{key: 'key', value: 'value', effect: Taint.NO_SCHEDULE}];
    component.ngOnInit();
    component.deleteTaint(0);

    expect(component.taints).toEqual([]);
  });
});
