import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Movies from "./pages/Movies";
import Reviews from "./pages/Reviews";
import Community from "./pages/Community";
import Login from "./pages/Login";

import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function App() {
  return (
    <BrowserRouter>

      <Header />

      <Routes>

        {/* HOME - PUBLIC */}
        <Route
          path="/"
          element={<Home />}
        />

        {/* LOGIN - PUBLIC */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* MOVIES - PROTECTED */}
        <Route
          path="/movies"
          element={
            <ProtectedRoute>
              <Movies />
            </ProtectedRoute>
          }
        />

        {/* REVIEWS - PROTECTED */}
        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <Reviews />
            </ProtectedRoute>
          }
        />

        {/* COMMUNITY - PROTECTED */}
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          }
        />

      </Routes>

      <Footer />

    </BrowserRouter>
  );
}

export default App;