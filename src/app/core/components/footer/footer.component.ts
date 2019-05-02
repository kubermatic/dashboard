import {Component, Input, OnInit} from '@angular/core';

import {AppConfigService} from '../../../app-config.service';
import {CustomLink, CustomLinkLocation, getCustomIcon} from '../../../shared/entity/CustomLinks';
import {VersionInfo} from '../../../shared/entity/VersionInfo';
import {Config} from '../../../shared/model/Config';

@Component({
  selector: 'kubermatic-footer',
  templateUrl: 'footer.component.html',
  styleUrls: ['footer.component.scss'],
})
export class FooterComponent implements OnInit {
  @Input() version: VersionInfo;
  @Input() config: Config = {};
  @Input() authenticated: boolean;
  customLinks: CustomLink[] = [];

  constructor(private readonly _appConfigService: AppConfigService) {}

  ngOnInit(): void {
    this.customLinks = this._appConfigService.getCustomLinks(CustomLinkLocation.Footer);
  }

  isDemoSystem(): boolean {
    return this.config.show_demo_info;
  }

  showTermsOfService(): boolean {
    return this.config.show_terms_of_service;
  }

  getCustomLinkIconStyle(customLink: CustomLink): any {
    return {
      'background-image': `url('${getCustomIcon(customLink)}')`,
    };
  }
}
