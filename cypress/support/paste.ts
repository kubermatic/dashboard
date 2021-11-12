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

import Chainable = Cypress.Chainable;
import {Paths} from './paths';

/**
 * Simulates a paste event.
 * Modified from https://gist.github.com/nickytonline/bcdef8ef00211b0faf7c7c0e7777aaf6
 *
 * @param subject An input DOM element.
 * @param filename Filename that should be read and pasted into the input.
 *
 * @returns The chainable parameter.
 *
 * @example
 * cy.get('body').pasteFile('filename.txt');
 */
export function pasteFile(subject: any, filename: string): Chainable {
  Cypress.log({
    displayName: 'pasteFile',
    message: `Subject: ${subject.selector}\n Filename: ${filename}\n`,
    name: 'Paste text from the file',
  });

  return cy.readFile(`${Paths.Fixtures}/${filename}`).then(text => _pasteFromClipboard(subject[0], text));
}

/**
 * Simulates a paste event.
 * Modified from https://gist.github.com/nickytonline/bcdef8ef00211b0faf7c7c0e7777aaf6
 *
 * @param subject An input DOM element.
 * @param text Text string that should be pasted into the input.
 *
 * @returns The subject parameter.
 *
 * @example
 * cy.get('body').paste('some text to paste');
 */
export function paste(subject: any, text: string): Chainable {
  Cypress.log({
    displayName: 'paste',
    message: `Subject: ${subject.selector}\n Text: ${text}\n`,
    name: 'Paste text',
  });

  _pasteFromClipboard(subject[0], text);
  return subject;
}

function _pasteFromClipboard(element: Element, text: string): Element {
  const pasteEvent = Object.assign(new Event('paste', {bubbles: true, cancelable: true}), {
    clipboardData: {
      getData: () => text,
    },
  });

  element.dispatchEvent(pasteEvent);
  return element;
}
