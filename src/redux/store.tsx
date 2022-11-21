import { createStore, combineReducers } from "redux";
import appSettingsReducer from "./appSettingsReducer";
import companyInfoReducer from "./companyInfoReducer";
import employeeInfoReducer from "./employeeInfoReducer";
import incomeDetailsReducer from "./incomeDetailsReducer";
import generalInfoReducer from "./generalInfoReducer";
import initialState from "../assets/data/initialstate";

const rootReducer = combineReducers({ 
    appSettings: appSettingsReducer,
    companyInfo: companyInfoReducer,
    employeeInfo: employeeInfoReducer,
    incomeDetails: incomeDetailsReducer,
    generalInfo: generalInfoReducer
 });
const store = createStore(rootReducer, initialState);

export default store;