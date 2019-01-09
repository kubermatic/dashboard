import {async, ComponentFixture, TestBed} from '@angular/core/testing';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {StepsService} from '../../core/services/wizard/steps.service';
import {GoogleAnalyticsService} from '../../google-analytics.service';
import {SharedModule} from '../../shared/shared.module';
import {ProgressComponent} from './progress.component';

const modules: any[] = [
  BrowserModule,
  BrowserAnimationsModule,
  SharedModule,
];

describe('ProgressComponent', () => {
  let fixture: ComponentFixture<ProgressComponent>;
  let component: ProgressComponent;

  beforeEach(async(() => {
    TestBed
        .configureTestingModule({
          imports: [
            ...modules,
          ],
          declarations: [
            ProgressComponent,
          ],
          providers: [
            StepsService,
            GoogleAnalyticsService,
          ],
        })
        .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressComponent);
    component = fixture.componentInstance;
    component.steps = [
      {
        name: 'test-0',
        description: 'test-0-description',
        valid: () => false,
      },
      {
        name: 'test-1',
        description: 'test-1-description',
        valid: () => false,
      },
      {
        name: 'test-2',
        description: 'test-2-description',
        valid: () => false,
      },
    ];
    component.currentStep = component.steps[1];
    component.currentStepIndex = 1;

    fixture.detectChanges();
  });

  it('should create the progress cmp', () => {
    expect(component).toBeTruthy();
  });

  it('should return correct icon class', () => {
    expect(component.getIconClass(0)).toBe('fa fa-check');
    expect(component.getIconClass(1)).toBe('fa fa-circle-o-notch fa-spin');
    expect(component.getIconClass(2)).toBe('');
  });

  it('should return correct title class', () => {
    expect(component.getTitleClass(2)).toBe('km-title-unchecked');
    expect(component.getTitleClass(1)).toBe('');
    expect(component.getTitleClass(0)).toBe('');
  });

  it('should return correct cursor style', () => {
    expect(component.getCursor(2)).toBe('default');
    expect(component.getCursor(1)).toBe('default');
    expect(component.getCursor(0)).toBe('pointer');
  });
});
