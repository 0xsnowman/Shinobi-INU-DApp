import React from "react";
import { BrowserRouter, Switch, Route, Redirect } from "react-router-dom";

// pages
import Home from "./pages/home";
import NotFound from "./pages/not-found";

// style
import "./styles/index.scss";
import "react-toastify/dist/ReactToastify.css";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/">
          <Home />
        </Route>
        <Route exact path="/not-found">
          <NotFound />
        </Route>
        <Redirect to="/not-found" />
      </Switch>
    </BrowserRouter>
  );
};

export default App;
