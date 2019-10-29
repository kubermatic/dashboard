import {animate, state, style, transition, trigger} from '@angular/animations';

export const slideInOut = trigger('slideInOut', [
  state('true', style({
          overflow: 'hidden',
          height: '*',
        })),
  state('false', style({
          opacity: '0',
          overflow: 'hidden',
          height: '0px',
        })),
  transition('true => false', animate('500ms ease-in-out')),
  transition('false => true', animate('500ms ease-in-out')),
]);
