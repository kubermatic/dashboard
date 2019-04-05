import {Component, Input} from '@angular/core';
import {VersionInfo} from '../../../shared/entity/VersionInfo';
import {Config} from '../../../shared/model/Config';

@Component({
  selector: 'kubermatic-footer',
  templateUrl: 'footer.component.html',
  styleUrls: ['footer.component.scss'],
})
export class FooterComponent {
  @Input() version: VersionInfo;
  @Input() config: Config = {};
  @Input() authenticated: boolean;

  isDemoSystem(): boolean {
    return this.config.show_demo_info;
  }

  showTermsOfService(): boolean {
    return this.config.show_terms_of_service;
  }
}
