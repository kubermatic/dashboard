import {AfterViewInit, ChangeDetectionStrategy, Component, ComponentFactoryResolver, OnInit, QueryList, ViewChildren, ViewContainerRef} from '@angular/core';
import {FormArray, FormBuilder, FormGroup} from '@angular/forms';
import {MatStep} from '@angular/material/stepper';

import {steps} from './config';
import {StepBase} from './step/base';
import {WizardStep} from './step/step';

@Component({
  selector: 'kubermatic-wizard',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardComponent implements OnInit, AfterViewInit {
  form: FormGroup;

  @ViewChildren('dynamic', {read: ViewContainerRef})
  private readonly _stepComponentRefList: QueryList<ViewContainerRef>;
  @ViewChildren('matStep') private readonly _stepList: QueryList<MatStep>;

  private _steps: FormArray;

  constructor(private _formBuilder: FormBuilder, private _resolver: ComponentFactoryResolver) {}

  get steps(): WizardStep[] {
    return this._steps.controls.map(formGroup => formGroup.value.config);
  }

  ngOnInit(): void {
    this._steps =
        this._formBuilder.array(steps.filter(step => step.required).map(step => this._formBuilder.group(step.config)));
    this.form = this._formBuilder.group({steps: this._steps});
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

  isStepValid(stepNr: number): boolean {
    return this._steps.controls[stepNr].valid;
  }
}
