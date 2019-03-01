import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SlimLoadingBarModule} from 'ng2-slim-loading-bar';

import {SharedModule} from '../../shared.module';
import {LabelFormComponent} from './label-form.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SlimLoadingBarModule.forRoot(),
  SharedModule,
];

describe('LabelFormComponent', () => {
  let fixture: ComponentFixture<LabelFormComponent>;
  let component: LabelFormComponent;

  beforeEach(() => {
    TestBed
        .configureTestingModule({
          imports: [...modules],
        })
        .compileComponents();
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
});
