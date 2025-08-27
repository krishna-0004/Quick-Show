import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

const Home = () => <h1 style={{ paddingTop: "80px", textAlign: "center" }}>Home Page</h1>;
const Movies = () => <h1 style={{ paddingTop: "80px", textAlign: "center" }}>Movies Page</h1>;
const Booking = () => <h1 style={{ paddingTop: "80px", textAlign: "center" }}>Booking Page</h1>;

function App() {
  return (
    <>
      <Navbar />
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/booking" element={<Booking />} />
        </Routes>
      </div>
    </>
  );
}

export default App;
