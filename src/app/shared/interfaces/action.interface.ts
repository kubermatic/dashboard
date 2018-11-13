import {Action as RAction} from 'redux';

export interface Action extends RAction {
  payload?: any;
}
