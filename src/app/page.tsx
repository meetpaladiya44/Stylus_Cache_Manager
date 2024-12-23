import Navbar from "@/app/components/Navbar";
import Footer from "./components/Footer";
import CacheManagerDashboard from "./components/CacheManagerDashboard";

import "../app/css/Landing.css";

export default function Home() {
  return (
    <div className="">
      <Navbar />
      <CacheManagerDashboard />
      <Footer />
    </div>
  );
}
