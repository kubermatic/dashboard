// Copyright 2020 The Kubermatic Kubernetes Platform contributors.
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

import {CustomLink, CustomLinkIcon} from './settings';

describe('Settings', () => {
  it('should correctly assign default custom link icon to unknown service', () => {
    const link: CustomLink = {label: 'Unknown Service', url: 'www.unknown.com'};
    expect(CustomLink.getIcon(link)).toBe(CustomLinkIcon.Default);
  });

  it('should correctly assign default custom link icon to unknown service', () => {
    const link: CustomLink = {label: '', url: ''};
    expect(CustomLink.getIcon(link)).toBe(CustomLinkIcon.Default);
  });

  it('should correctly assign custom link icon to known service based on label or URL', () => {
    const link: CustomLink = {label: 'Twitter', url: 'www.twitter.com'};
    expect(CustomLink.getIcon(link)).toBe(CustomLinkIcon.Twitter);
  });

  it('should correctly assign custom link icon to known service based on label', () => {
    const link: CustomLink = {label: 'Slack', url: '192.168.1.1:8080'};
    expect(CustomLink.getIcon(link)).toBe(CustomLinkIcon.Slack);
  });

  it('should correctly assign custom link icon to known service based on URL', () => {
    const link: CustomLink = {label: 'Repository', url: 'www.github.com'};
    expect(CustomLink.getIcon(link)).toBe(CustomLinkIcon.GitHub);
  });

  it('should correctly assign default custom link icon to unknown service if specified icon is empty', () => {
    const link: CustomLink = {
      label: 'Unknown Service',
      url: 'www.unknown.com',
      icon: '',
    };
    expect(CustomLink.getIcon(link)).toBe(CustomLinkIcon.Default);
  });

  it('should correctly assign custom link icon that was specified', () => {
    const link: CustomLink = {
      label: 'Unknown Service',
      url: 'www.unknown.com',
      icon: 'www.google.com/some-image.png',
    };
    expect(CustomLink.getIcon(link)).toBe(link.icon);
  });

  it('should correctly assign custom link icon that was specified', () => {
    const link: CustomLink = {
      label: 'Slack',
      url: 'www.twitter.com',
      icon: 'www.google.com/some-image.png',
    };
    expect(CustomLink.getIcon(link)).toBe(link.icon);
  });

  it('should correctly assign custom link icon that was specified', () => {
    const link: CustomLink = {
      label: '',
      url: '',
      icon: '/assets-mounted-into-container/icons/slack.svg',
    };
    expect(CustomLink.getIcon(link)).toBe(link.icon);
  });

  it('should correctly assign custom link icon that was specified', () => {
    const link: CustomLink = {
      label: 'Slack',
      url: 'slack.com',
      icon: '/assets-mounted-into-container/icons/github.svg',
    };
    expect(CustomLink.getIcon(link)).toBe(link.icon);
  });
});
