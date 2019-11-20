import {Component, Input} from '@angular/core';

import {AdminSettings} from '../../../shared/entity/AdminSettings';
import {VersionInfo} from '../../../shared/entity/VersionInfo';
import {CustomLink, CustomLinkLocation, filterCustomLinks} from '../../../shared/utils/custom-link-utils/custom-link';

@Component({
  selector: 'kubermatic-footer',
  templateUrl: 'footer.component.html',
  styleUrls: ['footer.component.scss'],
})
export class FooterComponent {
  @Input() version: VersionInfo;
  @Input() settings: AdminSettings;
  @Input() authenticated: boolean;

  getCustomLinks(): CustomLink[] {
    return filterCustomLinks(this.settings.customLinks, CustomLinkLocation.Footer);
  }

  getCustomLinkIconStyle(link: CustomLink): any {
    return {'background-image': `url('${CustomLink.getIcon(link)}')`};
  }
}
