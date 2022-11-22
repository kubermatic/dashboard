// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {ThemeInformerService} from '@core/services/theme-informer';

/**
 * Used to apply correct styling for the editor header.
 * It's required as the background color changes across various components.
 */
export enum EditorHeaderClass {
  Card = 'card',
  Dialog = 'dialog',
}

@Component({
  selector: 'km-editor',
  templateUrl: 'template.html',
  styleUrls: ['style.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class EditorComponent implements OnInit {
  @Input() header = '';
  @Input() headerClass: EditorHeaderClass = EditorHeaderClass.Dialog;
  @Input() height = '300px';
  @Input() language = 'yaml';
  @Input() model: string;
  @Output() modelChange = new EventEmitter<string>();
  isFocused = false;

  /**
   * All configuration options can be found at:
   * https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.ieditoroptions.html
   */
  options: any = {
    contextmenu: false,
    fontFamily: 'Inconsolata, monospace',
    fontSize: 14,
    lineNumbersMinChars: 4,
    minimap: {enabled: false},
    scrollbar: {vertical: 'hidden'},
    hideCursorInOverviewRuler: true,
    renderLineHighlight: 'none',
    wordWrap: 'on',
  };

  constructor(private readonly _themeInformerService: ThemeInformerService) {}

  ngOnInit(): void {
    this.options.theme = this._themeInformerService.isCurrentThemeDark ? 'vs-dark' : 'vs';
    this.options.language = this.language.toLowerCase();
  }

  onInit(editor: any): void {
    editor.onDidFocusEditorText(() => (this.isFocused = true));
    editor.onDidBlurEditorText(() => (this.isFocused = false));
  }

  onChange(): void {
    this.modelChange.emit(this.model);
  }

  getHeaderClasses(): string {
    return this.isFocused ? `${this.headerClass} focused` : this.headerClass;
  }
}
