import React, { Fragment } from "react";
import LeftMenu from "../LeftMenu/LeftMenu";
import TopMenu from "../TopMenu/TopMenu";
import { Routes, Route } from "react-router-dom";
import Users from "../Users/Users";
import Home from "../Home/Home";
import Notifications from "../../common/components/Notification";
import {PrivateRoute} from "../../common/components/PrivateRoute";

const Admin: React.FC = () => {

  return (
    <Fragment>
      <Notifications />
      <LeftMenu />
      <div id="content-wrapper" className="d-flex flex-column">
        <div id="content">
          <TopMenu />
          <div className="container-fluid">
            <Routes>
              <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
              <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
            </Routes>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default Admin;
