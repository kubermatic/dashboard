// Copyright 2024 The Kubermatic Kubernetes Platform contributors.
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

import {AfterViewInit, Directive, ElementRef} from '@angular/core';

// TODO: Remove this directive once the bug is fixed
/**
 * Temporary code to fix Chrome browser crashing.
 * See: https://issues.chromium.org/issues/335553723?pli=1
 */
@Directive({
  selector: 'mat-select',
})
export class HotfixMatSelectDirective implements AfterViewInit {
  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit(): void {
    this.removeAriaOwns();
  }

  private removeAriaOwns(): void {
    // Get the parent element of mat-select
    const parentElement = this.elementRef.nativeElement.parentElement;

    // Find the label element within the parent span
    const labelElement = parentElement.querySelector('span > label');

    if (labelElement) {
      // Remove the aria-owns attribute from the label element
      labelElement.removeAttribute('aria-owns');
      labelElement.removeAttribute('aria-labelledby');
    }
  }
}
