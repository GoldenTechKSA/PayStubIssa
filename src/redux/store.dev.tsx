import { createStore, combineReducers } from "redux";
import { composeWithDevTools } from "@redux-devtools/extension";
import appSettingsReducer from "./app-settings-reducer";
import companyInfoReducer from "./company-info-reducer";
import employeeInfoReducer from "./employee-info-reducer";
import incomeDetailsReducer from "./income-details-reducer";
import generalInfoReducer from "./general-info-reducer";
import { initialState } from "../assets/data/initial-state";

const rootReducer = combineReducers({ 
    appSettings: appSettingsReducer,
    companyInfo: companyInfoReducer,
    employeeInfo: employeeInfoReducer,
    incomeDetails: incomeDetailsReducer,
    generalInfo: generalInfoReducer
 });
const store = createStore(rootReducer, initialState, composeWithDevTools());

export default store;