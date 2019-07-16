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

  it('should initialize', () => {
    expect(component).toBeTruthy();
  });
});
