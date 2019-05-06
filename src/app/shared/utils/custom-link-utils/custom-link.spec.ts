import {CustomLink, CustomLinkIcon} from './custom-link';

describe('CustomLink', () => {
  it('should correctly assign default icon to unknown service', () => {
    const link: CustomLink = {label: 'Unknown Service', url: 'www.unknown.com'};
    expect(CustomLink.getIcon(link)).toBe(CustomLinkIcon.Default);
  });

  it('should correctly assign default icon to unknown service', () => {
    const link: CustomLink = {label: '', url: ''};
    expect(CustomLink.getIcon(link)).toBe(CustomLinkIcon.Default);
  });

  it('should correctly assign icon to known service based on label or URL', () => {
    const link: CustomLink = {label: 'Twitter', url: 'www.twitter.com'};
    expect(CustomLink.getIcon(link)).toBe(CustomLinkIcon.Twitter);
  });

  it('should correctly assign icon to known service based on label', () => {
    const link: CustomLink = {label: 'Slack', url: '192.168.1.1:8080'};
    expect(CustomLink.getIcon(link)).toBe(CustomLinkIcon.Slack);
  });

  it('should correctly assign icon to known service based on URL', () => {
    const link: CustomLink = {label: 'Repository', url: 'www.github.com'};
    expect(CustomLink.getIcon(link)).toBe(CustomLinkIcon.GitHub);
  });

  it('should correctly assign default icon to unknown service if specified icon is empty', () => {
    const link: CustomLink = {label: 'Unknown Service', url: 'www.unknown.com', icon: ''};
    expect(CustomLink.getIcon(link)).toBe(CustomLinkIcon.Default);
  });

  it('should correctly assign icon that was specified', () => {
    const link: CustomLink = {label: 'Unknown Service', url: 'www.unknown.com', icon: 'www.google.com/some-image.png'};
    expect(CustomLink.getIcon(link)).toBe(link.icon);
  });

  it('should correctly assign icon that was specified', () => {
    const link: CustomLink = {label: 'Slack', url: 'www.twitter.com', icon: 'www.google.com/some-image.png'};
    expect(CustomLink.getIcon(link)).toBe(link.icon);
  });

  it('should correctly assign icon that was specified', () => {
    const link: CustomLink = {label: '', url: '', icon: '/assets-mounted-into-container/icons/slack.svg'};
    expect(CustomLink.getIcon(link)).toBe(link.icon);
  });

  it('should correctly assign icon that was specified', () => {
    const link:
        CustomLink = {label: 'Slack', url: 'slack.com', icon: '/assets-mounted-into-container/icons/github.svg'};
    expect(CustomLink.getIcon(link)).toBe(link.icon);
  });
});
