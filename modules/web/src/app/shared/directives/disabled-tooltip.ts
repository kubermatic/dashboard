// Copyright 2026 The Kubermatic Kubernetes Platform contributors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {Directive, DoCheck, ElementRef, Renderer2} from '@angular/core';

/**
 * Directive applied to `<button>` elements to allow `matTooltip` to work even when the button is disabled.
 *
 * Angular Material sets `pointer-events: none` on disabled buttons, which prevents mouse events
 * from reaching the element and therefore prevents `matTooltip` from showing. This directive
 * overrides that behavior by restoring `pointer-events: auto` while the button is disabled, so
 * hover events still fire and the tooltip is visible. The native `disabled` attribute continues to
 * prevent actual click events at the browser level.
 *
 * Usage:
 * ```html
 * <button mat-flat-button
 *         kmDisabledTooltip
 *         [disabled]="isDisabled"
 *         [matTooltip]="isDisabled ? 'Reason for disabling' : ''">
 *   Label
 * </button>
 * ```
 */
@Directive({
  selector: 'button[kmDisabledTooltip]',
  standalone: false,
})
export class DisabledTooltipDirective implements DoCheck {
  private _wasDisabled = false;

  constructor(
    private readonly _el: ElementRef<HTMLButtonElement>,
    private readonly _renderer: Renderer2
  ) {}

  ngDoCheck(): void {
    const disabled = this._el.nativeElement.disabled;
    if (disabled !== this._wasDisabled) {
      this._wasDisabled = disabled;
      if (disabled) {
        this._renderer.setStyle(this._el.nativeElement, 'pointer-events', 'auto');
        this._renderer.setStyle(this._el.nativeElement, 'cursor', 'not-allowed');
      } else {
        this._renderer.removeStyle(this._el.nativeElement, 'pointer-events');
        this._renderer.removeStyle(this._el.nativeElement, 'cursor');
      }
    }
  }
}
