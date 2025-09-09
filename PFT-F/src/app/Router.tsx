import { createBrowserRouter } from "react-router-dom";
import App from "../App"; // layout (Navbar/Sidebar + <Outlet/>)
import RegisterPage from "../pages/Auth/RegisterPage";
import LoginPage from "../pages/Auth/LoginPage";
import AuthLayout from "../pages/Auth/AuthLayout";
import RequireAuth from "../features/auth/RequireAuth";
import DashboardPage from "../pages/Dashboard";
import MainLayout from "../pages/MainLayout";
import CategoriesPage from "../pages/Categories";
import NotFoundPage from "./Components/NotFound";
import TransactionsPage from "../pages/Transactions";
import BudgetsPage from "../pages/Buget";
import HomePage from "../pages/HomePage";

export const router = createBrowserRouter([

  { path: "/", element: <HomePage /> },


  {
    element: <App />,
    children: [
    
    ],
   
  },
  {
    element:<RequireAuth/>,
    children:[
       {
    
    
        element: <MainLayout />,      
        children: [
          { path: "/dashboard", element: <DashboardPage /> },   
          { path: "/categories", element: <CategoriesPage /> },   
          { path: "/transactions", element: <TransactionsPage /> },
          {path:"/budgets",element:<BudgetsPage/>}
        ],
   
  }
    ]
  },
  {
     element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
 

    ],
  }
  ,{ path: "*", element: <NotFoundPage /> }

]);
