import { Routes, Route, useNavigate } from "react-router-dom";

const App = () => {
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const navigate = useNavigate();
  return (
    <div>
      {isLoggedIn ? <BasicExample /> : <CustomNavbar />}
      <Routes>
        <Route />
      </Routes>
    </div>
  );
};

export default App;
