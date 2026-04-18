import { useAuth } from "@/context/AuthContext";
import CustomerNavbar from "./CustomerNavbar";
import FarmerNavbar from "./FarmerNavbar";

export default function SmartNavbar() {
  const { role } = useAuth();
  
  if (role === "farmer") return <FarmerNavbar />;
  return <CustomerNavbar />;
}
