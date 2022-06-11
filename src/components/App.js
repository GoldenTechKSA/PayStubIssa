import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import AppHeader from "./common/appHeader";
import AppFooter from "./common/appFooter";
import AppBody from "./common/appBody";
import SpecialOfferPage from "./common/specialOfferPage";
import PaystubPreview from "./preview/paystubPreview";
import DailySpecialPage from "./common/dailySpecialPage";
import AboutUsPage from "./common/aboutUsPage";
import FAQPage from "./common/FAQPage";
import ContactUsPage from "./common/contactUsPage";
import PreviewTemplate from "./preview/previewTemplate";
import store from "../redux/store";

function App() {
    return (
        <>
            <AppHeader />
            <Switch>
                <Route path="/" exact component={AppBody} />
                <Route path="/specialOfferPage" component={SpecialOfferPage} />
                <Route path="/paystubPreview" component={PaystubPreview} />
                <Route path="/dailySpecialPage" component={DailySpecialPage} />
                <Route path="/aboutUsPage" component={AboutUsPage} />
                <Route path="/FAQPage" component={FAQPage} />
                <Route path="/contactUsPage" component={ContactUsPage} />
                <Route path="/printTemplate/:templateType" render={(props) => (<PreviewTemplate {...props} store={store.getState()}/>)}/>
                <Redirect to={"/"}/>
                <Route render={() => <div><h1>Page Not Found!</h1></div>} />
            </Switch>
            <AppFooter />
        </>
    );
}

//<Route path="/printTemplate" render={(props) => (<PrintTemplate0 {...props} store={store.getState()}/>)}/>
export default App;