import React, { useState } from 'react';
import apiClient from 'Services/apiService';

interface FormData {
  name: string;
  address: string;
  mobile: string;
  email?: string;
  aadhar?: string;
  gstin?: string;
}

const AddCustomerForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    mobile: '',
    email: '',
    aadhar: '',
    gstin: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): Partial<Record<keyof FormData, string>> => {
    const tempErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      tempErrors.name = 'Name is required';
    }
    if (!formData.address.trim()) {
      tempErrors.address = 'Address is required';
    }
    if (!formData.mobile.trim()) {
      tempErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      tempErrors.mobile = 'Enter a valid 10-digit mobile number';
    }

    return tempErrors;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    try {
      await apiClient.post('/api/v1/customer/register', formData);
      setFormData({ name: '', address: '', mobile: '', email: '', aadhar: '', gstin: '' });
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ name: '', address: '', mobile: '', email: '', aadhar: '', gstin: '' });
    setErrors({});
  };

  return (
    <div className="w-full h-screen bg-white flex flex-col justify-center items-center p-2">
      <h2 className="text-2xl font-semibold mb-4">Add New Customer</h2>
      <form onSubmit={handleSubmit} className="w-full max-h-full overflow-hidden space-y-4">
        <div className="w-full">
          <label className="block text-sm font-medium mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter Customer's Name"
            className={`w-full border p-2 rounded ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium mb-1">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter Customer's Address"
            className={`w-full border p-2 rounded ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium mb-1">
            Mobile No <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="Enter Customer's Mobile Number"
            className={`w-full border p-2 rounded ${
              errors.mobile ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter Customer's Email"
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium mb-1">Aadhar No.</label>
          <input
            type="text"
            name="aadhar"
            value={formData.aadhar}
            onChange={handleChange}
            placeholder="Enter Customer's Aadhar No."
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>

        <div className="w-full">
          <label className="block text-sm font-medium mb-1">GSTIN</label>
          <input
            type="text"
            name="gstin"
            value={formData.gstin}
            onChange={handleChange}
            placeholder="Enter Customer's GST No."
            className="w-full border border-gray-300 p-2 rounded"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
          <button
            type="submit"
            className="w-full sm:w-auto bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCustomerForm;
