import { createStore, combineReducers } from "redux";
import appSettingsReducer from "./app-settings-reducer";
import companyInfoReducer from "./company-info-reducer";
import employeeInfoReducer from "./employee-info-reducer";
import incomeDetailsReducer from "./income-details-reducer";
import generalInfoReducer from "./general-info-reducer";
import { initialState as devInitialState} from "../assets/data/initial-state";
import { prodInitialState} from "../assets/data/production-initial-state";
import type { PayStubDetails } from "../assets/data/pay-stub-details";

const getInitialState = () => {
    if (process.env.NODE_ENV === "production") {
        return prodInitialState; // Use the reducers' default state in production
    }
    return devInitialState;
};

const rootReducer = combineReducers({ 
    appSettings: appSettingsReducer,
    companyInfo: companyInfoReducer,
    employeeInfo: employeeInfoReducer,
    incomeDetails: incomeDetailsReducer,
    generalInfo: generalInfoReducer
 });
/** A fresh store seeded with the environment's initial state (tests pass overrides). */
export const createAppStore = (preloaded: Partial<PayStubDetails> = {}) =>
    createStore(rootReducer, { ...getInitialState(), ...preloaded } as any);

const store = createAppStore();

export default store;