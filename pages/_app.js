import '../styles/globals.css'
import { AdminProvider } from "../contexts/admin-contexts";
import AdminModeHandler from "../components/admin-mode-handler";

export default function App({ Component, pageProps }) {
  return (
    <AdminProvider>
      <AdminModeHandler />
      <Component {...pageProps} />
    </AdminProvider>
  );
}
