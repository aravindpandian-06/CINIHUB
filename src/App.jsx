
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Intro from "./pages/Intro";
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
      <Routes>
        {/* Intro video - public entry page */}
        <Route path="/" element={<Intro />} />

        {/* Home - public */}
        <Route
          path="/home"
          element={
            <>
              <Header />
              <Home />
              <Footer />
            </>
          }
        />

        {/* Login - public */}
        <Route
          path="/login"
          element={
            <>
              <Header />
              <Login />
              <Footer />
            </>
          }
        />

        {/* Sign Up - public */}
        <Route
          path="/signup"
          element={
            <>
              <Header />
              <Login initialSignUp={true} />
              <Footer />
            </>
          }
        />

        {/* Movies - protected */}
        <Route
          path="/movies"
          element={
            <ProtectedRoute>
              <>
                <Header />
                <Movies />
                <Footer />
              </>
            </ProtectedRoute>
          }
        />

        {/* Reviews - protected */}
        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <>
                <Header />
                <Reviews />
                <Footer />
              </>
            </ProtectedRoute>
          }
        />

        {/* Community - protected */}
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <>
                <Header />
                <Community />
                <Footer />
              </>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
