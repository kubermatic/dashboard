import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeInformerService {
  readonly isCurrentThemeDark$ = new BehaviorSubject<boolean>(false);

  get isCurrentThemeDark(): boolean {
    return this.isCurrentThemeDark$.getValue();
  }
}
