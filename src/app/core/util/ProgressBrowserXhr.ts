import { Injectable } from '@angular/core';
import { BrowserXhr } from '@angular/http';
import { SlimLoadingBarService } from 'ng2-slim-loading-bar';

@Injectable()
export class ProgressBrowserXhr extends BrowserXhr {

  constructor(private progressService: SlimLoadingBarService) {
    super();
  }

  build(): any {
    const xhr = super.build();

    xhr.onprogress = (event) => {
      const percentage = event.total === 0 ? 0 : Math.round((event.loaded * 100 / event.total));

      if (percentage === 0) {
        this.progressService.start();
        this.progressService.progress = 10;
        setTimeout(() => {
          this.progressService.progress = 20;
        }, 50);
      } else {
        setTimeout(() => {
          this.progressService.progress = Math.max(percentage, 20);
        }, 100);
      }

      if (percentage === 100) {
        this.progressService.progress = 1.1 * this.progressService.progress;
        setTimeout(() => {
          this.progressService.complete();
        }, 200);
      }
    };

    return <any> xhr;
  }
}
