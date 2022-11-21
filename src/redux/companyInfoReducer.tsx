import * as actionTypes from "../constants/actionTypes";

export default function companyInfoReducer(state = {}, action) {
    switch (action.type) {
        case actionTypes.SAVE_COMPANY_INFO: 
            return {...state, ...action.payload};
        default: 
            return state; 
    }
}