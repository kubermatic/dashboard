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

import * as _ from 'lodash';

export class TrafficMonitor {
  private _timeout = -1;
  private _url = '';
  private _method = RequestType.GET;
  private _asAlias = '';
  private _alias = '';
  private _retry = 1;
  private _intercepted = false;

  private readonly _defaultAlias = 'default';

  static newTrafficMonitor(): TrafficMonitor {
    return new TrafficMonitor();
  }

  url(url: string): TrafficMonitor {
    this._url = url;
    return this;
  }

  method(requestType: RequestType): TrafficMonitor {
    this._method = requestType;
    return this;
  }

  alias(alias: string): TrafficMonitor {
    if (alias.startsWith('@')) {
      throw new Error('alias cannot start with @');
    }

    this._alias = `@${alias}`;
    this._asAlias = alias;
    return this;
  }

  timeout(timeout: number): TrafficMonitor {
    this._timeout = timeout;
    return this;
  }

  retry(retry: number): TrafficMonitor {
    this._retry = retry;
    return this;
  }

  intercept(): TrafficMonitor {
    this._validate();
    this._setDefaults();

    cy.intercept(this._method, this._url).as(this._asAlias);
    this._intercepted = true;
    return this;
  }

  wait(): Cypress.Chainable {
    if (!this._intercepted) {
      throw new Error('Intercept has to be called first');
    }

    return this._timeout > 0 ? cy.wait(this._alias, {timeout: this._timeout}) : cy.wait(this._alias);
  }

  interceptAndWait(): Cypress.Chainable {
    this._validate();
    this._setDefaults();

    cy.intercept(this._method, this._url).as(this._asAlias);
    return this._timeout > 0 ? cy.wait(this._alias, {timeout: this._timeout}) : cy.wait(this._alias);
  }

  expect(response: Response): Cypress.Chainable {
    if (this._retry < 1) {
      throw new Error('Expected conditions not met within retry limit');
    }

    this._retry--;
    return this.interceptAndWait().then(xhr => {
      try {
        switch (response.type) {
          case ResponseType.LIST:
            return this._expectArray(response, xhr.response.body);
          case ResponseType.OBJECT:
            return this._expectObject(response, xhr.response.body);
        }
      } catch (err) {
        return this.expect(response);
      }
    });
  }

  private _expectObject(response: Response, obj: any): TrafficMonitor {
    expect(response.properties.every(property => property.compare(obj)));
    return this;
  }

  private _expectArray(response: Response, objArr: any[]): TrafficMonitor {
    if (response.limit > -1) {
      expect(objArr.length).to.eq(response.limit);
    }

    if (response.properties.length > 0) {
      // TODO: Right now only first object properties are checked
      expect(response.properties.every(property => property.compare(objArr[0]))).to.be.true;
    }

    return this;
  }

  private _validate(): void {
    if (!this._method || !this._url) {
      throw new Error('Missing required parameters');
    }
  }

  private _setDefaults(): void {
    const suffix = _.uniqueId();
    this._alias = this._alias ? this._alias : `@${this._defaultAlias}-${suffix}`;
    this._asAlias = this._asAlias ? this._asAlias : `${this._defaultAlias}-${suffix}`;
  }
}

export enum RequestType {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
}

export enum ResponseType {
  LIST = 'list',
  OBJECT = 'object',
}

export class Property {
  private readonly _name: string;
  private readonly _value: string;

  get name(): string {
    return this._name;
  }

  get value(): string {
    return this._value;
  }

  constructor(name: string, value: string) {
    this._name = name;
    this._value = value;
  }

  compare(obj: any): boolean {
    return obj[this._name] === this._value;
  }

  static newProperty(name: string, value: string) {
    return new Property(name, value);
  }
}

export class Response {
  private _responseType: ResponseType;
  private _elementsCount = -1;
  private _properties: Property[] = [];

  get type(): ResponseType {
    return this._responseType;
  }

  get limit(): number {
    return this._elementsCount;
  }

  get properties(): Property[] {
    return this._properties;
  }

  constructor(responseType: ResponseType) {
    this._responseType = responseType;
  }

  elements(count: number): Response {
    this._elementsCount = count;
    return this;
  }

  property(property: Property): Response {
    this._properties.push(property);
    return this;
  }

  static newResponse(responseType: ResponseType): Response {
    return new Response(responseType);
  }
}
