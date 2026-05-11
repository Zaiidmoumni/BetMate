import { BrowserRouter as Router, useRoutes } from "react-router-dom";
import Layout from "./layouts/clientLayout";
import routes from "./routes/routes";
import { Toaster } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "./store/store";
import { useEffect } from "react";
import { fetchUserProfile } from "./utils/profileUtils";

function AppRoutes() {
  const element = useRoutes(routes);
  return element;
}

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile(dispatch);
    }
  }, [dispatch, isAuthenticated]);
  return (
    <Router>
      <Layout>
        <Toaster
          position="bottom-right"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              background: "#333",
              color: "#fff",
            },
          }}
        />
        <AppRoutes />
      </Layout>
    </Router>
  );
}

export default App;
