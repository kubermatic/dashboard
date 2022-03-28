import {Pages} from '../../pages';
import {RootPage} from '../page';
import {LoginStrategy} from './types';

export class RealLoginStrategy implements LoginStrategy {
  constructor(private readonly _context: RootPage) {}

  login(email: string, password: string): void {
    this._context.visit();
    this._context.Buttons.login.click();
    Pages.Dex.login(email, password);
  }

  logout(): void {
    this._context.UserPanel.open.click();
    this._context.UserPanel.logout.click();
  }
}
