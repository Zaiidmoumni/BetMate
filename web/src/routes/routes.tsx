import { RouteObject } from "react-router-dom";
import Home from "../pages/Home";
import ForgotPassword from "@/pages/Auth/ForgotPassword";
import { ProtectedRoute, PublicRoute } from "@/guards/auth.guard";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import GamesPage from "@/pages/Games";
import WalletPage from "@/pages/Wallet";
import HistoryPage from "@/pages/History";
import EmailVerificationPage from "@/pages/Auth/EmailVerification";
import ResetPasswordPage from "@/pages/Auth/ResetPassword";
import PaymentReturn from "@/components/wallet/transaction-return";
import AdminTransactionsPage from "@/pages/Transactions";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/forgot-password",
    element: (
      <PublicRoute>
        <ForgotPassword />
      </PublicRoute>
    ),
  },
  {
    path: "/login",
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicRoute>
        <Register />
      </PublicRoute>
    ),
  },
  {
    path: "/verify",
    element: (
      <PublicRoute>
        <EmailVerificationPage />
      </PublicRoute>
    ),
  },
  {
    path: "/reset-password",
    element: (
      <PublicRoute>
        <ResetPasswordPage />
      </PublicRoute>
    ),
  },
  {
    path: "/games",
    element: <GamesPage />,
  },
  {
    path: "my-wallet",
    element: (
      <ProtectedRoute>
        <WalletPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "history",
    element: (
      <ProtectedRoute>
        <HistoryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "payment/return/:transactionId",
    element: (
      <ProtectedRoute>
        <PaymentReturn/>
      </ProtectedRoute>
    )
  },
  {
    path: "transactions",
    element: (
      <ProtectedRoute>
        <AdminTransactionsPage/>
      </ProtectedRoute>
    )
  }
];

export default routes;
