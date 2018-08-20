import { Injectable } from '@angular/core';

@Injectable()
export class GoogleAnalyticsService {

  private active = false;

  public emitEvent(eventCategory: string,
                   eventAction: string,
                   eventLabel: string = null,
                   eventValue: number = null) {
    if (!this.active) {
      return;
    }
    ga('send', 'event', {
      eventCategory: eventCategory,
      eventLabel: eventLabel,
      eventAction: eventAction,
      eventValue: eventValue
    });
  }

  public activate(googleAnalyticsCode: string, googleAnalyticsConfig: object | null, currentUrl: string) {
    (function(i, s, o, g, r, a, m) {i['GoogleAnalyticsObject'] = r;
      i[r] = i[r] || function() {
        (i[r].q = i[r].q || []).push(arguments); }, i[r].l = new Date().getTime(); a = s.createElement(o),
        m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m);
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

  public sendPageView(urlAfterRedirects: string) {
    if (!this.active) {
      return;
    }
    ga('set', 'page', urlAfterRedirects);
    ga('send', 'pageview');
  }
}
