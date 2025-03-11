import React, { useState } from 'react';
import apiClient from 'Services/apiService'; // Ensure this path is correct

const BillForm = () => {
    const [formData, setFormData] = useState({
        vehicleRegNumber: '',
        customerName: '',
        serviceCharges: '',
        cGst: '',
        sGst: '',
        partsUsed: '',
        billDate: '',
        customerContact: '',
        totalAmount: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            // Call the API directly using apiClient.post
            const response = await apiClient.post('/pdf/generatePdf', formData, {
                responseType: 'blob', // Important for handling binary data like PDFs
            });

            // Create a URL for the PDF blob
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'bill.pdf'); // Set the filename for the downloaded file
            document.body.appendChild(link);
            link.click(); // Trigger the download
            link.remove(); // Clean up the DOM
        } catch (error) {
            console.error('Error generating PDF:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" name="vehicleRegNumber" value={formData.vehicleRegNumber} onChange={handleChange} placeholder="Vehicle Registration Number" required />
            <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} placeholder="Customer Name" required />
            <input type="number" name="serviceCharges" value={formData.serviceCharges} onChange={handleChange} placeholder="Service Charges" required />
            <input type="number" name="cGst" value={formData.cGst} onChange={handleChange} placeholder="CGST" required />
            <input type="number" name="sGst" value={formData.sGst} onChange={handleChange} placeholder="SGST" required />
            <input type="text" name="partsUsed" value={formData.partsUsed} onChange={handleChange} placeholder="Parts Used" required />
            <input type="date" name="billDate" value={formData.billDate} onChange={handleChange} required />
            <input type="text" name="customerContact" value={formData.customerContact} onChange={handleChange} placeholder="Customer Contact" required />
            <input type="number" name="totalAmount" value={formData.totalAmount} onChange={handleChange} placeholder="Total Amount" required />
            <button type="submit">Generate PDF</button>
        </form>
    );
};

export default BillForm;