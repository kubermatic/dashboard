import {Component, Input, SecurityContext} from '@angular/core';
import {DomSanitizer, SafeStyle} from '@angular/platform-browser';
import {CustomLink, CustomLinkLocation, filterCustomLinks} from '../../../shared/utils/custom-link-utils/custom-link';
import {AdminSettings} from '../../../shared/entity/AdminSettings';
import {VersionInfo} from '../../../shared/entity/VersionInfo';

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

  constructor(private readonly _sanitizer: DomSanitizer) {}

  getCustomLinks(): CustomLink[] {
    const customLinks = this.authenticated ? this.settings.customLinks : this.customLinks;
    return filterCustomLinks(customLinks, CustomLinkLocation.Footer);
  }

  getBackgroundImageUrlStyle(link: CustomLink): SafeStyle {
    return this._sanitizer.sanitize(SecurityContext.STYLE, `url(${CustomLink.getIcon(link)})`);
  }

  getFilterStyle(): SafeStyle {
    return this.authenticated
      ? ''
      : this._sanitizer.bypassSecurityTrustStyle('invert(.25) brightness(100) contrast(100)');
  }
}
