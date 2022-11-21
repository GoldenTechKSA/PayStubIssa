import * as actionTypes from "../constants/actionTypes";

export default function appSettingsReducer(state = {}, action) {
    switch (action.type) {
        case actionTypes.UPDATE_APP_SETTINGS:
            return {...state, ...action.payload};
        default:
            return state; 
    }
}