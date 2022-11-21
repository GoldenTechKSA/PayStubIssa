import * as actionTypes from "../constants/actionTypes";

export default function incomeDetailsReducer(state = {}, action) {
    switch (action.type) {
        case actionTypes.SAVE_INCOME_DETAILS: 
            return {...state, ...action.payload};
        default: 
            return state; 
    }
}