import React from "react";
import "./App.css";
import "./styles/sb-admin-2.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Account/Login";
import Admin from "./components/Admin/Admin";
import Register from "./components/Account/Register";
import {PrivateComponent} from "./common/components/PrivateComponent";

const App: React.FC = () => {
    return (
        <div className="App" id="wrapper">
            <Router>
                <PrivateComponent>
                    <Admin />
                </PrivateComponent>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Routes>
            </Router>
        </div>
    );
};

export default App;
