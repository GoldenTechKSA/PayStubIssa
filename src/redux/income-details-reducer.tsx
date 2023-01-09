import * as actionTypes from "../constants/action-types";

export default function incomeDetailsReducer(state = {}, action) {
    switch (action.type) {
        case actionTypes.SAVE_INCOME_DETAILS: 
            return {...state, ...action.payload};
        default: 
            return state; 
    }
}