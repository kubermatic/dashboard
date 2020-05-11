import {animate, state, style, transition, trigger} from '@angular/animations';

export const fadeInOut = trigger('fadeInOut', [
  state(
    'true',
    style({
      overflow: 'hidden',
      height: '*',
    })
  ),
  state(
    'false',
    style({
      opacity: '0',
      overflow: 'hidden',
    })
  ),
  transition('true => false', animate('500ms ease-in-out')),
  transition('false => true', animate('500ms ease-in-out')),
]);
