// Copyright 2021 The Kubermatic Kubernetes Platform contributors.
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

import {Injectable} from '@angular/core';

/* eslint-disable */

@Injectable()
export class GoogleAnalyticsService {
  private active = false;

  emitEvent(eventCategory: string, eventAction: string, eventLabel: string = null, eventValue: number = null): void {
    if (!this.active) {
      return;
    }
    ga('send', 'event', {
      eventCategory,
      eventLabel,
      eventAction,
      eventValue,
    });
  }

  activate(googleAnalyticsCode: string, googleAnalyticsConfig: object | null, currentUrl: string): void {
    (function (i, s, o, g, r, a, m) {
      i['GoogleAnalyticsObject'] = r;
      (i[r] =
        i[r] ||
        function () {
          (i[r].q = i[r].q || []).push(arguments);
        }),
        (i[r].l = new Date().getTime());
      (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
      a.async = 1;
      a.src = g;
      m.parentNode.insertBefore(a, m);
    })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

    ga('create', googleAnalyticsCode, 'auto');
    if (googleAnalyticsConfig) {
      Object.keys(googleAnalyticsConfig).forEach(key => {
        ga('set', key, googleAnalyticsConfig[key]);
      });
    }

    this.active = true;
    this.sendPageView(currentUrl);
  }

  sendPageView(urlAfterRedirects: string): void {
    if (!this.active) {
      return;
    }
    ga('set', 'page', urlAfterRedirects);
    ga('send', 'pageview');
  }
}
