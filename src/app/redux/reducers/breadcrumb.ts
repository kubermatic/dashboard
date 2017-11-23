import { Action } from "@ngrx/store";
import { Actions } from "./actions";

export interface Breadcrumb {
  crumb: string;
}

const initialState: Breadcrumb = {
  crumb: "",
};

export function breadcrumbReducer(state: Breadcrumb = initialState, action: Action): Breadcrumb {
  switch (action.type) {
    case Actions.PUT_BREADCRUMB:
      return Object.assign({}, state, {
        crumb: action.payload.crumb,
      });
    default:
      return state;
  }
}

export const getCrumb = (state: Breadcrumb) => state.crumb;
