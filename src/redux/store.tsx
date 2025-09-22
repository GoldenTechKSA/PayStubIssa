import { createStore, combineReducers } from "redux";
import appSettingsReducer from "./app-settings-reducer";
import companyInfoReducer from "./company-info-reducer";
import employeeInfoReducer from "./employee-info-reducer";
import incomeDetailsReducer from "./income-details-reducer";
import generalInfoReducer from "./general-info-reducer";
import { initialState as devState} from "../assets/data/initial-state";

const getInitialState = () => {
    if (process.env.NODE_ENV === "production") {
        return {}; // Use the reducers' default state in production
    }
    return devState;
};

const rootReducer = combineReducers({ 
    appSettings: appSettingsReducer,
    companyInfo: companyInfoReducer,
    employeeInfo: employeeInfoReducer,
    incomeDetails: incomeDetailsReducer,
    generalInfo: generalInfoReducer
 });
const store = createStore(rootReducer, getInitialState());

export default store;