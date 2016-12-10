import { KubermaticPage } from './app.po';

describe('kubermatic App', function() {
  let page: KubermaticPage;

  beforeEach(() => {
    page = new KubermaticPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
