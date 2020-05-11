import {Component, Input} from '@angular/core';

import {AdminSettings} from '../../../shared/entity/AdminSettings';
import {VersionInfo} from '../../../shared/entity/VersionInfo';
import {
  CustomLink,
  CustomLinkLocation,
  filterCustomLinks,
} from '../../../shared/utils/custom-link-utils/custom-link';

@Component({
  selector: 'km-footer',
  templateUrl: 'footer.component.html',
  styleUrls: ['footer.component.scss'],
})
export class FooterComponent {
  @Input() version: VersionInfo;
  @Input() settings: AdminSettings;
  @Input() customLinks: CustomLink[] = [];
  @Input() authenticated: boolean;

  getCustomLinks(): CustomLink[] {
    const customLinks = this.authenticated
      ? this.settings.customLinks
      : this.customLinks;
    return filterCustomLinks(customLinks, CustomLinkLocation.Footer);
  }

  getCustomLinkIconStyle(link: CustomLink): any {
    const style = {'background-image': `url('${CustomLink.getIcon(link)}')`};

    if (!this.authenticated) {
      style['filter'] = 'invert(.25) brightness(100) contrast(100)';
    }

    return style;
  }
}
