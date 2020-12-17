// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//     http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Injectable, Injector, ComponentRef, Renderer2, RendererFactory2} from '@angular/core';
import {Overlay, OverlayConfig, OverlayRef, ConnectionPositionPair} from '@angular/cdk/overlay';
import {ComponentPortal, PortalInjector} from '@angular/cdk/portal';
import {DialogComponent} from './component';
import {DialogRef} from './overlay-ref';
import {DialogConfig, DEFAULT_CONFIG} from './entity';
import {DialogHelperService} from './helper.service';
import {GuidedTourStep, STEP_DATA, STEP_ORDER} from '../entity';
import {POSITION_MAP} from '../utils';

@Injectable()
export class DialogService {
  private _tempSteps: GuidedTourStep[] = [];
  private _renderer: Renderer2;

  dialogRef: DialogRef;
  targetBackdrop: Element;
  mainElement = document.body.querySelector('.km-main');

  constructor(
    private _injector: Injector,
    private _overlay: Overlay,
    rendererFactory: RendererFactory2,
    private _dialogHelperService: DialogHelperService
  ) {
    this._renderer = rendererFactory.createRenderer(null, null);
  }

  get steps(): GuidedTourStep[] {
    return this._dialogHelperService.getSteps();
  }

  get currentStepIndex(): number {
    return this._dialogHelperService.getCurrentStepIndex();
  }

  get isTourInProgress(): boolean {
    return this._dialogHelperService.isTourInProgress();
  }

  startTour(): void {
    this._dialogHelperService.resetTour();
    this.showDialog();
  }

  showDialog(): void {
    this._dialogHelperService.setTourInProgress(true);

    this._dialogHelperService.setSteps([]);
    const stepIds = STEP_ORDER;
    const steps = [];
    stepIds.forEach(stepId => {
      const stepItem = this._tempSteps.find(item => item.id === stepId);
      steps.push(stepItem);
    });
    this._dialogHelperService.setSteps(steps);

    if (this.isTourInProgress) {
      this.open();
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  open(config: DialogConfig = {}): void {
    const nativeElement = this._getNativeElement();
    const dialogConfig = {...DEFAULT_CONFIG, ...config};
    const overlayRef = this._createOverlay(dialogConfig);

    overlayRef.detachments().subscribe(() => {
      this._renderer.removeClass(nativeElement, 'highlight');
      this._renderer.removeChild(this.mainElement, this.targetBackdrop);
    });

    this.dialogRef = new DialogRef(overlayRef);
    this._attachDialogContainer(overlayRef, this.dialogRef);

    this._renderer.addClass(nativeElement, 'highlight');

    if (this.steps[this.currentStepIndex].withBackdrop) {
      this._createBackdrop();
    }
  }

  addStep(stepToAdd: GuidedTourStep): void {
    const stepExist = this._tempSteps.filter(step => step.id === stepToAdd.id).length > 0;
    if (!stepExist) {
      this._tempSteps.push(stepToAdd);
    } else {
      const stepIndexToReplace = this._tempSteps.findIndex(step => step.id === stepToAdd.id);
      this._tempSteps[stepIndexToReplace] = stepToAdd;
    }
  }

  showNextStep(): void {
    this._dialogHelperService.setCurrentStepIndex(this.currentStepIndex + 1);
    this.dialogRef.close();
    this._renderer.removeChild(this.mainElement, this.targetBackdrop);

    setTimeout(() => {
      try {
        this.showDialog();
      } catch (error) {
        this.dialogRef.close();
        this._renderer.removeChild(this.mainElement, this.targetBackdrop);
        this._dialogHelperService.resetTour();
      }
    }, 1);
  }

  private _getNativeElement(): Element {
    let nativeElement: Element;
    if (this.steps[this.currentStepIndex].elementRef.nativeElement.getBoundingClientRect) {
      nativeElement = this.steps[this.currentStepIndex].elementRef.nativeElement;
    } else {
      nativeElement = this.steps[this.currentStepIndex].elementRef.nativeElement._elementRef.nativeElement;
    }

    return nativeElement;
  }

  private _createOverlay(config: DialogConfig): OverlayRef {
    const overlayConfig = this._getOverlayConfig(config);
    return this._overlay.create(overlayConfig);
  }

  private _attachDialogContainer(overlayRef: OverlayRef, dialogRef: DialogRef): DialogComponent {
    const injector = this._createInjector(dialogRef);
    const containerPortal = new ComponentPortal(DialogComponent, null, injector);
    const containerRef: ComponentRef<DialogComponent> = overlayRef.attach(containerPortal);
    return containerRef.instance;
  }

  private _createInjector(dialogRef: DialogRef): PortalInjector {
    const injectionTokens = new WeakMap();
    injectionTokens.set(DialogRef, dialogRef);
    injectionTokens.set(STEP_DATA, this.steps[this.currentStepIndex]);
    return new PortalInjector(this._injector, injectionTokens);
  }

  private _getOverlayConfig(config: DialogConfig): OverlayConfig {
    const positionStrategy = this._overlay
      .position()
      .flexibleConnectedTo(this.steps[this.currentStepIndex].targetViewContainer.element)
      .withPositions(this._getPositions());

    const overlayConfig = new OverlayConfig({
      hasBackdrop: config.hasBackdrop,
      panelClass: config.panelClass,
      scrollStrategy: this._overlay.scrollStrategies.block(),
      positionStrategy,
    });

    return overlayConfig;
  }

  private _getPositions(): ConnectionPositionPair[] {
    switch (this.steps[this.currentStepIndex].position) {
      case 'top':
        return [POSITION_MAP.top];
      case 'bottom':
        return [POSITION_MAP.bottom];
      case 'left':
        return [POSITION_MAP.left];
      case 'right':
        return [POSITION_MAP.right];
      default:
        return [POSITION_MAP.bottom];
    }
  }

  private _createBackdrop(): void {
    this.targetBackdrop = this._renderer.createElement('div');
    this._renderer.addClass(this.targetBackdrop, 'backdrop-target');
    this._renderer.appendChild(this.mainElement, this.targetBackdrop);
  }
}
