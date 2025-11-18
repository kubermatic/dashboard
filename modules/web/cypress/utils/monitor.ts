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

import _ from 'lodash';

export enum RequestType {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export enum ResponseType {
  LIST = 'list',
  OBJECT = 'object',
}

export enum MatchRule {
  EVERY,
  SOME,
}

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

  expect(response: ResponseCheck): Cypress.Chainable {
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

  private _expectObject(response: ResponseCheck, obj: any): TrafficMonitor {
    expect(response.properties.check(obj));
    return this;
  }

  private _expectArray(response: ResponseCheck, objArr: any[]): TrafficMonitor {
    if (response.limit > -1) {
      expect(objArr.length).to.eq(response.limit);
    }

    switch (response.objMatchRule) {
      case MatchRule.EVERY:
        expect(objArr.every(obj => response.properties.check(obj))).to.equal(true);
        break;
      case MatchRule.SOME:
        expect(objArr.some(obj => response.properties.check(obj))).to.equal(true);
        break;
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

/**
 * ResponseCheck is used to perform check on a response to verify its type, properties (set match rule to specify
 * if every or just some objects from list should pass this check; applies only to lists) and number of elements
 * (applies only to lists).
 */
export class ResponseCheck {
  private _type: ResponseType;
  private _properties: PropertiesCheck = new PropertiesCheck();
  private _objMatchRule: MatchRule;
  private _limit = -1;

  constructor(type: ResponseType, objMatchRule = MatchRule.EVERY) {
    this._type = type;
    this._objMatchRule = objMatchRule;
  }

  get type(): ResponseType {
    return this._type;
  }

  get properties(): PropertiesCheck {
    return this._properties;
  }

  get objMatchRule(): MatchRule {
    return this._objMatchRule;
  }

  get limit(): number {
    return this._limit;
  }

  elements(limit: number): ResponseCheck {
    this._limit = limit;
    return this;
  }

  property(key: string, value: string): ResponseCheck {
    this._properties.add(key, value);
    return this;
  }
}

/**
 * PropertiesCheck is used to perform check on a object to verify if it contains specific set of properties.
 */
class PropertiesCheck {
  private readonly _propertyChecks: PropertyCheck[] = [];

  add(key: string, value: string): void {
    this._propertyChecks.push(new PropertyCheck(key, value));
  }

  check(obj: any): boolean {
    return this._propertyChecks.every(propertyCheck => propertyCheck.check(obj));
  }
}

/**
 * PropertyCheck is used to perform check on a object to verify if it contains specific property.
 */
class PropertyCheck {
  private readonly _key: string;
  private readonly _value: string;

  constructor(key: string, value: string) {
    this._key = key;
    this._value = value;
  }

  check(obj: any): boolean {
    return obj[this._key] === this._value;
  }
}
