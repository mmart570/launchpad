import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import StudentLogin from "./pages/StudentLogin";

// Define the application's routes and provide router context.
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Display the landing page at the site root. */}
        <Route path="/" element={<LandingPage />} />

        {/* Display the student login page at the login route. */}
        <Route path="/login" element={<StudentLogin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
