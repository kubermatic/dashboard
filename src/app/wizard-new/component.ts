import {ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {MatStepper} from '@angular/material/stepper';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ProjectService} from '../core/services';
import {ProjectEntity} from '../shared/entity/ProjectEntity';

import {steps} from './config';
import {WizardService} from './service/wizard';
import {StepRegistry, WizardStep} from './step/step';

@Component({
  selector: 'kubermatic-wizard',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardComponent implements OnInit, OnDestroy {
  form: FormGroup;
  project = {} as ProjectEntity;
  readonly stepRegistry = StepRegistry;

  @ViewChild('stepper', {static: true}) private readonly _stepper: MatStepper;

  private _unsubscribe: Subject<void> = new Subject<void>();

  constructor(
      private _formBuilder: FormBuilder, private readonly _projectService: ProjectService,
      private readonly _wizard: WizardService) {}

  get steps(): WizardStep[] {
    return this._wizard.steps.filter(step => step.enabled);
  }

  get active(): WizardStep {
    return this.steps[this._stepper.selectedIndex];
  }

  get first(): boolean {
    return this._stepper.selectedIndex === 0;
  }

  get last(): boolean {
    return this._stepper.selectedIndex === (this.steps.length - 1);
  }

  get invalid(): boolean {
    return this.form.get(this.active.name).invalid;
  }

  ngOnInit(): void {
    // // Init steps for wizard
    this._wizard.steps = steps;
    this._wizard.stepper = this._stepper;

    this._initForm(this.steps);
    this._wizard.stepsChanges.pipe(takeUntil(this._unsubscribe)).subscribe(_ => this._initForm(this.steps));

    this._stepper.selectionChange.pipe(takeUntil(this._unsubscribe)).subscribe(stepperEvent => {
      if (stepperEvent.previouslySelectedIndex > stepperEvent.selectedIndex) {
        stepperEvent.previouslySelectedStep.reset();
      }
    });

    this._projectService.selectedProject.pipe(takeUntil(this._unsubscribe))
        .subscribe(project => this.project = project);
  }

  showNext(step: WizardStep): boolean {
    const restrictedList = [StepRegistry.Datacenter, StepRegistry.Provider, StepRegistry.Summary];
    return !restrictedList.includes(step.name as StepRegistry);
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
    this._wizard.reset();
  }

  private _initForm(steps: WizardStep[]): void {
    const controls = {};
    steps.forEach(step => controls[step.name] = this._formBuilder.control(''));
    this.form = this._formBuilder.group(controls);
  }
}
