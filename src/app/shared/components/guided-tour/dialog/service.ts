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

import {Injectable, Injector, ComponentRef} from '@angular/core';
import {Overlay, OverlayConfig, OverlayRef, ConnectionPositionPair} from '@angular/cdk/overlay';
import {ComponentPortal, PortalInjector} from '@angular/cdk/portal';
import {DialogComponent} from './component';
import {DialogRef} from './overlay-ref';
import {DialogConfig, DEFAULT_CONFIG} from './entity';
import {GuidedTourStep, STEP_DATA} from '../entity';

@Injectable()
export class DialogService {
  private _step: GuidedTourStep;

  constructor(private injector: Injector, private overlay: Overlay) {}

  open(config: DialogConfig = {}): DialogRef {
    const dialogConfig = {...DEFAULT_CONFIG, ...config};
    const overlayRef = this.createOverlay(dialogConfig);
    const dialogRef = new DialogRef(overlayRef);
    this.attachDialogContainer(overlayRef, dialogRef);
    return dialogRef;
  }

  private createOverlay(config: DialogConfig): OverlayRef {
    const overlayConfig = this.getOverlayConfig(config);
    return this.overlay.create(overlayConfig);
  }

  private attachDialogContainer(overlayRef: OverlayRef, dialogRef: DialogRef): DialogComponent {
    const injector = this.createInjector(dialogRef);
    const containerPortal = new ComponentPortal(DialogComponent, null, injector);
    const containerRef: ComponentRef<DialogComponent> = overlayRef.attach(containerPortal);
    return containerRef.instance;
  }

  private createInjector(dialogRef: DialogRef): PortalInjector {
    const injectionTokens = new WeakMap();
    injectionTokens.set(DialogRef, dialogRef);
    injectionTokens.set(STEP_DATA, this._step);
    return new PortalInjector(this.injector, injectionTokens);
  }

  private getOverlayConfig(config: DialogConfig): OverlayConfig {
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this._step.targetViewContainer.element)
      .withPositions(this.getPositions());

    const overlayConfig = new OverlayConfig({
      hasBackdrop: config.hasBackdrop,
      backdropClass: config.backdropClass,
      panelClass: config.panelClass,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy,
    });

    return overlayConfig;
  }

  private getPositions(): ConnectionPositionPair[] {
    return [
      new ConnectionPositionPair({originX: 'start', originY: 'bottom'}, {overlayX: 'start', overlayY: 'top'}),
      new ConnectionPositionPair({originX: 'start', originY: 'top'}, {overlayX: 'start', overlayY: 'bottom'}),
    ];
  }

  addStep(stepToAdd: GuidedTourStep): void {
    this._step = stepToAdd;
  }
}
