import { Injectable } from '@angular/core';

@Injectable()
export class GoogleAnalyticsService {

  private active = false;

  public emitEvent(eventCategory: string,
                   eventAction: string,
                   eventLabel: string = null,
                   eventValue: number = null): void {
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

  public activate(googleAnalyticsCode: string, googleAnalyticsConfig: object | null, currentUrl: string): void {
    (function(i, s, o, g, r, a, m) {i['GoogleAnalyticsObject'] = r; // tslint:disable-line
      i[r] = i[r] || function() { // tslint:disable-line
        (i[r].q = i[r].q || []).push(arguments); }, i[r].l = new Date().getTime(); a = s.createElement(o),
        m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m); // tslint:disable-line
    })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

    ga('create', googleAnalyticsCode, 'auto');
    if (googleAnalyticsConfig) {
      Object.keys(googleAnalyticsConfig).forEach((key) => {
        ga('set', key, googleAnalyticsConfig[key]);
      });
    }

    this.active = true;
    this.sendPageView(currentUrl);
  }

  public sendPageView(urlAfterRedirects: string): void {
    if (!this.active) {
      return;
    }
    ga('set', 'page', urlAfterRedirects);
    ga('send', 'pageview');
  }
}
