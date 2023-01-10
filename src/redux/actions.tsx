import * as actionTypes from "../constants/action-types";

export function updateAppSettings(data) {
    return { type: actionTypes.UPDATE_APP_SETTINGS, payload: data };
}

export function saveCompanyInfo(data) {
    return { type: actionTypes.SAVE_COMPANY_INFO, payload : data };
}

export function saveEmployeeInfo(data) {
    return { type: actionTypes.SAVE_EMPLOYEE_INFO, payload : data };
}

export function saveIncomeDetails(data) {
    return { type: actionTypes.SAVE_INCOME_DETAILS, payload : data };
}

export function saveGeneralInfo(data) {
    return { type: actionTypes.SAVE_GENERAL_INFO, payload : data };
}

