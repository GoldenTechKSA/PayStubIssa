import * as actionTypes from "../constants/actionTypes";

export default function employeeInfoReducer(state = {}, action) {
    switch (action.type) {
        case actionTypes.SAVE_EMPLOYEE_INFO: 
            return {...state, ...action.payload};
        default: 
            return state; 
    }
}