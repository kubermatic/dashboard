import {animate, keyframes, style, transition, trigger} from '@angular/animations';

export const slideInOut = trigger('slideInOut', [
  transition(':enter', [
    style({transform: 'translateX(100%)'}),
    animate('200ms ease-in', style({transform: 'translateX(0%)'})),
  ]),
  transition(':leave', [animate('200ms ease-in', style({transform: 'translateX(100%)'}))]),
]);

export const slideOut = trigger('slideOut', [
  transition(':leave', [
    animate(
      '200ms 0s',
      keyframes([
        style({
          transform: 'translate3d(0, 0, 0)',
          offset: 0,
          opacity: '*',
          height: '*',
        }),
        style({
          transform: 'translate3d(100%, 0, 0)',
          offset: 1,
          opacity: 0,
          height: '*',
        }),
      ])
    ),
  ]),
]);
