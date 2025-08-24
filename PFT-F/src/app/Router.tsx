import { createBrowserRouter } from "react-router-dom";
import App from "../App"; // layout (Navbar/Sidebar + <Outlet/>)
import RegisterPage from "../pages/Auth/RegisterPage";
import LoginPage from "../pages/Auth/LoginPage";
import HomePage from "../pages/HomePage";
import AuthLayout from "../pages/Auth/AuthLayout";

export const router = createBrowserRouter([
  // herkese açık rotalar

  { path: "/", element: <HomePage /> },


  // uygulama içi (layout altında) rotalar
  {
    element: <App />,
    children: [
    
    ],
   
  },
  {
     element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
    ],
  }
]);
