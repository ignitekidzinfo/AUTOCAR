import { Route, Routes } from "react-router-dom";
import SignIn from "./pages/SignInSide";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
import AdminHeader from "pages/AdminHeader";
import Dashboard from "pages/Dashboard";
import ManageUsers from "pages/ManageUsers";
import WebHeader from "pages/Headers";
import MyAddSparePart from "pages/MyAddSparePart";
import SparePart from "pages/SparePart";
import EditSparePart from "pages/EditSparePart";
import BookAppointment from "pages/BookAppointment";
import SparePartDetails from "pages/SparePartDetails";
import VehicleRegistration from "pages/VehicleRegistraction";
import VehicleReg from 'pages/vehiclereg';
import VehicleById from 'pages/VehicleById';
import VehicleByDate from 'pages/vechiclebydate';
import Vehiclestatus from 'pages/vechiclestatus';
import VehicleByAppointmentId from 'pages/VehicleByAppointmentId';
import ManageRepairPage from "components/RepairsComponent/ManageRepairPage";
import VehicleList from "components/vehicle/VehicleList";
import AddVehicle from "components/vehicle/AddVehicle";
import TransactionAdd from "pages/TransactionManagement/TransactionAdd";
import TransactionAll from "pages/TransactionManagement/TransactionAll";
import AddVehiclePartService from "components/vehicle/AddVehiclePartService";
import StockManageGrid from "components/StockManagement/StockManageGrid";
import TransactionList from "components/StockManagement/TransactionList";
import VehicleDetailsView from "components/vehicle/VehicleDetailsView";
import InvoiceForm from "components/vehicle/InvoiceForm";
import BillForm from "components/vehicle/BillForm";
import TransactionDetails from "components/StockManagement/TransactionDetails";
// import InvoiceDetailsWrapper from "pages/TransactionManagement/InvoiceDetailsWrapper";

const AppRoutes = () => {
    return(
        <>
        <Routes>
            <Route path="*" element={<h2>404 Page Not Found</h2>} />
            <Route path="/signIn" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/user/reset-password" element={<ResetPassword/>} />
            <Route element={<WebHeader />} >
            <Route path="/" element = {<Home/>} />
            <Route path="/add-part" element={<MyAddSparePart />} /> 
            <Route path="/getAll" element={<SparePart />} /> 
             
            <Route path="/spare-part/:id" element={<SparePartDetails />} /> 
            <Route path="/book-service" element={<BookAppointment />} /> 
            <Route path="/edit-spare-part/:id" element={<EditSparePart />} />
            <Route path="/vehicle-registration" element={<VehicleRegistration />} />
            <Route path="/vehicle-regi" element={<VehicleReg />} />
            <Route path="/vehicle-by-id" element={<VehicleById />} />
            <Route path="/vehicle-by-date-range" element={<VehicleByDate />} />
            <Route path="/Vehiclestatus" element={<Vehiclestatus />} />
            <Route path="/VehicleByAppointmentId" element={<VehicleByAppointmentId />} />
            
            </Route>
            <Route path="/admin/*" element={<AdminHeader />}>
                <Route path="dashboard" element={<Dashboard />} />
                {/* <Route path="invoice/:id" element={<InvoiceDetailsWrapper />} /> */}
                <Route path="billForm/:id" element={<InvoiceForm />} />
                <Route path="transaction" element={<TransactionAdd />} /> 
                <Route path="manage-repair" element={<ManageRepairPage />} />
                <Route path="manage-stock" element={<StockManageGrid />} />
                <Route path="users" element={<ManageUsers />} />
                <Route path="bill" element={<BillForm />} />
                <Route path="transaction-list" element={<TransactionList />} /> 
                <Route path="user-part/view/:id" element={<TransactionDetails />} />
                <Route path="vehicle" element={<VehicleList />} />
                <Route path="vehicle/add" element={<AddVehicle/>} />
                <Route path="vehicle/edit/:id" element={<AddVehicle/>} />
                <Route path="vehicle/view/:id" element={<VehicleDetailsView/>} />
                <Route path="vehicle/add/servicepart/:id" element={<AddVehiclePartService/>} />
                <Route path="vehicle/details/:id" element={<AddVehicle/>} />
                <Route path="spare-part/transaction/add" element={<TransactionAdd />} />
                <Route path="spare-part/transaction/list" element={<TransactionAll />} />
            </Route>
        </Routes>
        </>
    )
}

export default AppRoutes;
