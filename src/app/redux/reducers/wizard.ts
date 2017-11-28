import { Action } from "../../shared/interfaces/action.interface";
import { Reducer } from 'redux';
import { BreadcrumbActions } from "../actions/breadcrumb.actions";

export interface Wizard {
}

export const INITIAL_STATE: Wizard = {
};

export const BreadcrumbReducer: Reducer<Wizard> = (state: Wizard = INITIAL_STATE, action: Action): Wizard => {
    switch (action.type) { }
    return state;
};
