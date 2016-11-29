import { DashboardPage } from './app.po';

describe('dashboard App', function() {
  let page: DashboardPage;

  beforeEach(() => {
    page = new DashboardPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('kubermatic works!');
  });
});
