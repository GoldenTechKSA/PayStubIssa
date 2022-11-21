import * as actionTypes from "../constants/actionTypes";

export default function generalInfoReducer(state = {}, action) {
    switch (action.type) {
        case actionTypes.SAVE_GENERAL_INFO: 
            return {...state, ...action.payload};
        default: 
            return state; 
    }
}