import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import AppHeader from "./common/appheader";
import AppFooter from "./common/appfooter";
import AppBody from "./common/appbody";
import SpecialOfferPage from "./common/specialofferpage";
import PaystubPreview from "./preview/paystubpreview";
import DailySpecialPage from "./common/dailyspecialpage";
import AboutUsPage from "./common/aboutuspage";
import FAQPage from "./common/faqpage";
import ContactUsPage from "./common/contactuspage";
import PreviewTemplate from "./preview/previewtemplate";
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