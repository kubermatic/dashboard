import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GlobalThemeService {
  readonly isCurrentThemeDark$ = new BehaviorSubject<boolean>(false);

  get isCurrentThemeDark(): boolean {
    return this.isCurrentThemeDark$.getValue();
  }
}
