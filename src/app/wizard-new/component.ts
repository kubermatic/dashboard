import {AfterViewInit, ChangeDetectionStrategy, Component, ComponentFactoryResolver, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, ViewContainerRef} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {MatStep, MatStepper} from '@angular/material/stepper';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {NewWizardService, ProjectService} from '../core/services';
import {ProjectEntity} from '../shared/entity/ProjectEntity';

import {steps} from './config';
import {StepBase} from './step/base';
import {WizardStep} from './step/step';

@Component({
  selector: 'kubermatic-wizard',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardComponent implements OnInit, OnDestroy, AfterViewInit {
  form: FormGroup;
  project = {} as ProjectEntity;

  @ViewChildren('dynamic', {read: ViewContainerRef})
  private readonly _stepComponentRefList: QueryList<ViewContainerRef>;
  @ViewChildren('matStep') private readonly _stepList: QueryList<MatStep>;
  @ViewChild('stepper', {static: true}) private readonly _stepper: MatStepper;

  private _steps: FormArray;
  private _unsubscribe: Subject<void> = new Subject<void>();

  constructor(
      private _formBuilder: FormBuilder, private _resolver: ComponentFactoryResolver,
      private readonly _projectService: ProjectService, private readonly _wizard: NewWizardService) {}

  get steps(): WizardStep[] {
    return this._steps.controls.map(formGroup => formGroup.value.config);
  }

  ngOnInit(): void {
    this._steps =
        this._formBuilder.array(steps.filter(step => step.required).map(step => this._formBuilder.group(step.config)));
    this.form = this._formBuilder.group({steps: this._steps});

    this._projectService.selectedProject.pipe(takeUntil(this._unsubscribe))
        .subscribe(project => this.project = project);

    this._wizard.stepper = this._stepper;
  }

  ngOnDestroy(): void {
    this._unsubscribe.next();
    this._unsubscribe.complete();
  }

  ngAfterViewInit(): void {
    this._stepComponentRefList.toArray().filter((_, i) => steps[i].required).forEach((stepComponentRef, i) => {
      stepComponentRef.clear();
      const factory = this._resolver.resolveComponentFactory(steps[i].component);
      const componentRef = stepComponentRef.createComponent<StepBase>(factory);

      if (!(componentRef.instance instanceof StepBase)) {
        componentRef.destroy();
        throw new Error('Wizard step has to extend StepBase');
      }

      // Initialize StepBase
      componentRef.instance.form = this._steps.controls[i] as FormGroup;

      // Set stepControl form programmatically to sync form state with step control
      this._stepList.toArray()[i].stepControl = componentRef.instance.form as any;
    });
  }
}
