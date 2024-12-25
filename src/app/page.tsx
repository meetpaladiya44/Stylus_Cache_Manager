import Navbar from "@/app/components/Navbar";
import Footer from "./components/Footer";
import CacheManagerDashboard from "./components/CacheManagerDashboard";

import "../app/css/Landing.css";
import CacheManagerPage from "./components/CacheManagerPage";

export default function Home() {
  return (
    <div className="">
      {/* <Navbar /> */}
      <CacheManagerPage />
      {/* <Footer /> */}
    </div>
  );
}
