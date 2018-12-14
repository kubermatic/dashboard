import './polyfills.ts';
import './vendor';

import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {AppModule} from './app/app.module';
import {environment} from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// tslint:disable-next-line:no-console
platformBrowserDynamic().bootstrapModule(AppModule).catch((err) => console.error(err));
