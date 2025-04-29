import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";
import WebHeader from "pages/Headers";
import AddCustomer from "components/Borrow/AddCustomer";
import AdminHeader from "pages/AdminHeader";
import TermsAndConditionsList from "components/Terms/TermsAndConditionsList";
import AddTermsAndConditions from "components/Terms/AddTermsAndConditions";
import EmployeeManagement from "pages/employee/EmployeeManagement";
import EmployeeList from "pages/employee/EmployeeList";
import AddCustomerPayment from "components/Borrow/AddCustomerPayment";
import CustomerDetailsList from "components/Borrow/CustomerDetailsList";
import ViewCustomerPayments from "components/Borrow/ViewCustomerPayments";
import EmployeeSalaryList from "components/Employee/EmployeeSalaryList";
import AddEmployeeSalary from "components/Employee/AddEmployeeSalary";
import AddEmployeeAdvancePayment from "components/Employee/AddEmployeeAdvancePayment";
import EmployeeAdvancePaymentList from "components/Employee/EmployeeAdvancePaymentList";
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
    <CircularProgress />
  </Box>
);

const SignIn = lazy(() => import("./pages/SignInSide"));
const Home = lazy(() => import("./pages/Home"));
const SignUp = lazy(() => import("./pages/SignUp"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("pages/Dashboard"));
const ManageUsers = lazy(() => import("pages/ManageUsers"));
const MyAddSparePart = lazy(() => import("pages/MyAddSparePart"));
const SparePart = lazy(() => import("pages/SparePart"));
const EditSparePart = lazy(() => import("pages/EditSparePart"));
const BookAppointment = lazy(() => import("pages/BookAppointment"));
const SparePartDetails = lazy(() => import("pages/SparePartDetails"));
const VehicleRegistration = lazy(() => import("pages/VehicleRegistraction"));
const VehicleReg = lazy(() => import('pages/vehiclereg'));
const VehicleById = lazy(() => import('pages/VehicleById'));
const VehicleByDate = lazy(() => import('pages/vechiclebydate'));
const Vehiclestatus = lazy(() => import('pages/vechiclestatus'));
const VehicleByAppointmentId = lazy(() => import('pages/VehicleByAppointmentId'));
const ManageRepairPage = lazy(() => import("components/RepairsComponent/ManageRepairPage"));
const VehicleList = lazy(() => import("components/vehicle/VehicleList"));
const QuatationList = lazy(() => import("components/Quatation/QuatationList"));
const PurchaseAccountReport = lazy(() => import("components/Reports/PurchaseAccountRepost"));
const AddVehicle = lazy(() => import("components/vehicle/AddVehicle"));
const TransactionAdd = lazy(() => import("pages/TransactionManagement/TransactionAdd"));
const TransactionAll = lazy(() => import("pages/TransactionManagement/TransactionAll"));
const AddVehiclePartService = lazy(() => import("components/vehicle/AddVehiclePartService"));
const QuatationGrid = lazy(() => import("components/Quatation/QuatationGrid"));
const StockManageGrid = lazy(() => import("components/StockManagement/StockManageGrid"));
const TransactionList = lazy(() => import("components/StockManagement/TransactionList"));
const VehicleDetailsView = lazy(() => import("components/vehicle/VehicleDetailsView"));
const InvoiceForm = lazy(() => import("components/vehicle/InvoiceForm"));
const BillForm = lazy(() => import("components/vehicle/BillForm"));
const AddNewQuotation = lazy(() => import("components/Quatation/QutationForm"));
const TransactionDetails = lazy(() => import("components/StockManagement/TransactionDetails"));
const CounterSaleForm = lazy(() => import("components/StockManagement/CounterSaleForm"));
const CounterBillPDF = lazy(() => import("components/StockManagement/CounterBillPDF"));
const SupplierListPage = lazy(() => import("components/Vendor/SupplierListPage"));
const AddNewSupplierPage = lazy(() => import("components/Vendor/VendorManagementPage"));
const VendorUpdatePage = lazy(() => import("components/Vendor/VendorUpdatePage"));
const InvoiceList = lazy(() => import("components/StockManagement/InvoiceList"));
const InvoiceEditForm = lazy(() => import("components/StockManagement/InvoiceEditForm"));
const AppointmentList = lazy(() => import("components/Appointments/AppointmentList"));
const JobCard = lazy(() => import("components/vehicle/jobCard"));
const EditJobOptionForm = lazy(() => import("components/JobCard/EditJobOptionForm"));
const JobCardGrid = lazy(() => import("components/JobCard/JobCardsGrid"));
const JobOptionForm = lazy(() => import("components/JobCard/JobOptionForm"));
const JobCardList = lazy(() => import("components/JobCard/JobCardList"));
const ManageServiceGrid = lazy(() => import("components/ManageServices/ManageServiceGrid"));
const AddService = lazy(() => import("components/ManageServices/AddService"));
const GetAllServices = lazy(() => import("components/ManageServices/GetAllServices"));
const EditService = lazy(() => import("components/ManageServices/EditServices"));
const JobCardPDF = lazy(() => import("components/vehicle/jobcardpdf"));
const InvoiceTable = lazy(() => import("components/vehicle/ServiceTab"));
const ServiceTab = lazy(() => import("components/vehicle/ServiceTab"));
const QuatationServiceTab = lazy(() => import("components/Quatation/QuatationServiceTab"));
const SpareTab = lazy(() => import("components/Quatation/SpareTab"));
const CustomerList = lazy(() => import("components/Customer/CustomerList"));
const InsuranceList = lazy(() => import("components/InsuranceList"));
const VendorManagementGrid = lazy(() => import("components/Vendor/VendorManagementGrid"));
const InvoicePDFGenerator = lazy(() => import("components/vehicle/InvoicePDFGenerator"));
const QuatationPDFGeneration = lazy(() => import("components/Quatation/QuatationPDFGeneration"));
const QuatationEdit = lazy(() => import("components/Quatation/QuatationEdit"));
const AddCustomerForm = lazy(() => import("components/Customer/Customers"));
const ReportForm = lazy(() => import("components/Reports/ReportForm"));
const CounterSaleReport = lazy(() => import("components/Reports/CounterSaleReport"));
const CounterSalesReportPDF = lazy(() => import("components/Reports/CounterSalesReportPDF"));
const JobSaleReport = lazy(() => import("components/Reports/JobSaleReport"));
const JobSaleReportPDF = lazy(() => import("components/Reports/JobSaleReportPDF"));
const PurchaseReport = lazy(() => import("components/Reports/PurchaseReport"));
const PurchaseReportPDF = lazy(() => import("components/Reports/PurchaseReportPDF"));
const NotesList = lazy(() => import("pages/Notes/NotesList"));
const SuperTechServiceReport = lazy(() => import("components/Reports/SuperTechServiceReport"));
const SuperTechServiceReportPDF = lazy(() => import("components/Reports/SuperTechServiceReportPDF"));
const VehicalHistoryWithPDF = lazy(() => import("components/Reports/VehicalHistoryWithPDF"));
const SpareSuppliersView = lazy(() => import("components/Vendor/SpareSuppliersView"));

// Bank Deposit components
const BankDepositList = lazy(() => import("pages/BankDepositList"));
const AddBankDeposit = lazy(() => import("pages/AddBankDeposit"));

const AppRoutes = () => {
    return(
        <>
        <Suspense fallback={<LoadingFallback />}>
        <Routes>
            <Route path="*" element={<h2>404 Page Not Found</h2>} />
            <Route path="/signIn" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/user/reset-password" element={<ResetPassword/>} />
            <Route element={<WebHeader />} >
            <Route path="/" element = {<Home/>} />
            <Route path="/add-part" element={<MyAddSparePart />} /> 
            <Route path="/terms/add" element={<AddTermsAndConditions />} /> 
            <Route path="/getAll" element={<SparePart />} /> 
            <Route path="/supplier/add" element={<AddNewSupplierPage />} /> 
            <Route path="/supplier/update/:vendorId" element={<VendorUpdatePage />} />
            
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
            <Route path="/admin" element={<AdminHeader />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="appointmentList" element={<AppointmentList />} />
                <Route path="customer/add" element={<AddCustomer />} />
                <Route path="jobCardgrid" element={<JobCardGrid />} />
                <Route path="manageVendor" element={<VendorManagementGrid />} />
                <Route path="billForm/:id" element={<InvoiceForm />} />
                <Route path="customer/payment/view/:id" element={<ViewCustomerPayments />} />
                <Route path="customer/payment/add/:id" element={<AddCustomerPayment />} />
                <Route path="jobcardpdf" element={<JobCardPDF />} />
                <Route path="manageborrow" element={<CustomerDetailsList />} />
                <Route path="invoicepdfgenerator" element={<InvoicePDFGenerator />} />
                <Route path="employeeManagement" element={<EmployeeManagement />} />
                <Route path="employeeList" element={<EmployeeList />} />
                <Route path="employeeManagement/edit/:userId" element={<EmployeeManagement />} />
                <Route path="manage-customer" element={<CustomerList />} />
                <Route path="AddCustomer" element={<AddCustomerForm />} />  
                <Route path="manage-reports" element={<ReportForm />} />
                <Route path="insuranceList" element={<InsuranceList />} />
                <Route path="manage-purchaseaccountreport" element={<PurchaseAccountReport />} />
                <Route path="manage-Notes" element={<NotesList/>} />
                
                {/* Terms and Conditions Routes */}
                <Route path="manage-Terms" element={<TermsAndConditionsList/>} />
                
                {/* Route for editing - matches /admin/terms/edit/:id */}
                <Route path="terms/edit/:id" element={<AddTermsAndConditions />} />
                
                {/* Route for adding - matches /admin/terms/add */}
                <Route path="terms/add" element={<AddTermsAndConditions />} />

                <Route path="ServiceTable" element={<InvoiceTable />} />
                <Route path="serviceManage" element={<AddService />} />
                <Route path="invoice/edit" element={<InvoiceEditForm />} />
                <Route path="vendorManagement" element={<SupplierListPage />} />
                <Route path="counterbillPdf" element={<CounterBillPDF />} />
                <Route path="counterSale" element={<CounterSaleForm />} />
                <Route path="counterSale/:invoiceNumber" element={<CounterSaleForm />} />
                <Route path="transaction" element={<TransactionAdd />} /> 
                <Route path="manage-repair" element={<ManageRepairPage />} />
                <Route path="manageService" element={<GetAllServices />} />
                <Route path="manage-stock" element={<StockManageGrid />} />
                <Route path="editJob/:id" element={<EditJobOptionForm />} />
                <Route path="users" element={<ManageUsers />} />
                <Route path="bill" element={<BillForm />} />
                <Route path="invoiceList" element={<InvoiceList />} />
                <Route path="transaction-list" element={<TransactionList />} /> 
                <Route path="user-part/view/:id" element={<TransactionDetails />} />
                <Route path="vehicle" element={<VehicleList />} />
                <Route path="quatationlist" element={<QuatationList />} />

                <Route path="countersalereport" element={<CounterSaleReport />} />
                <Route path="countersalereportPdf" element={<CounterSalesReportPDF />} />
                <Route path="jobsalereport" element={<JobSaleReport />} />
                <Route path="jobsalereportPdf" element={<JobSaleReportPDF />} />
                <Route path="purchasereport" element={<PurchaseReport />} />
                <Route path="purchasereportPdf" element={<PurchaseReportPDF />} />
                <Route path="supertechservicereport" element={<SuperTechServiceReport />} />
                <Route path="supertechservicereportPdf" element={<SuperTechServiceReportPDF/>} />
                <Route path="vehiclehistorywithpdf" element={<VehicalHistoryWithPDF/>} />
                <Route path="editService/:id" element={<EditService />} />
                <Route path="vehicle/add" element={<AddVehicle/>} />
                <Route path="jobcards/add" element={<JobOptionForm />} />
                <Route path="job-card/:id" element={<JobCard/>} />
                <Route path="quatation" element={<AddNewQuotation />} />
                <Route path="quationserviceTab/:vehicleId" element={<QuatationServiceTab />} />

                <Route path="serviceTab/:vehicleId" element={<ServiceTab />} />
                <Route path="spareTab/:vehicleId" element={<SpareTab />} />
                <Route path="quotation/edit/:id" element={<QuatationEdit/>} />

                <Route path="vehicle/edit/:id" element={<AddVehicle/>} />
                <Route path="vehicle/view/:id" element={<VehicleDetailsView/>} />
                <Route path="vehicle/add/sparepart/:id" element={<QuatationGrid/>} />
                <Route path="manage-salary" element={<EmployeeSalaryList/>} />
                <Route path="add-employee-salary" element={<AddEmployeeSalary/>} />
                <Route path="add-employee-advance/:id" element={<AddEmployeeAdvancePayment/>} />
                <Route path="employee-advance-list/:id" element={<EmployeeAdvancePaymentList/>} />
                <Route path="/admin/edit-employee-salary/:id" element={<AddEmployeeSalary />} />

                <Route path="vehicle/add/servicepart/:id" element={<AddVehiclePartService/>} />
                <Route path="add-vehicle-part-service/:id" element={<AddVehiclePartService/>} />
                <Route path="vehicle/details/:id" element={<AddVehicle/>} />
                <Route path="jobcard/manage" element={<JobCardList/>} />
                <Route path="services" element={<ManageServiceGrid/>} />
                <Route path="spare-part/transaction/add" element={<TransactionAdd />} />
                <Route path="spare-part/transaction/list" element={<TransactionAll />} />
                <Route path="spare-supplier/:partNumber/:manufacturer" element={<SpareSuppliersView />} />

                {/* Bank Deposit Routes */}
                <Route path="bank-deposits" element={<BankDepositList />} />
                <Route path="add-bank-deposit" element={<AddBankDeposit />} />
                <Route path="edit-bank-deposit/:id" element={<AddBankDeposit />} />
            </Route>
        </Routes>
        </Suspense>
        </>
    )
}

export default AppRoutes;