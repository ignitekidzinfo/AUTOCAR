import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Save, X, Trash2, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SparePartGetByID } from "Services/SparePartService";
import apiClient from "Services/apiService";

function EditSparePart() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [sparePart, setSparePart] = useState({
    partName: "",
    description: "",
    manufacturer: "",
    price: "", 
    partNumber: "", 
    sGST: "", 
    cGST: "", 
    totalGST: "", 
    buyingPrice: "", 
    photo: [] as string[],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteType, setDeleteType] = useState<string | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [isBreaking, setIsBreaking] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("Invalid Spare Part ID");
      setLoading(false);
      return;
    }

    const fetchSparePart = async () => {
      try {
        setLoading(true);
        const response = await SparePartGetByID(id);
        setSparePart({
          ...response,
          price: response.price?.toString() || "",
          sGST: response.sgst?.toString() || "",   
          cGST: response.cgst?.toString() || "",   
          totalGST: response.totalGST?.toString() || "", 
          buyingPrice: response.buyingPrice?.toString() || "",
          partNumber: response.partNumber || "",
        });
      } catch (err) {
        console.error("Error fetching spare part:", err);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchSparePart();
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const invalidFiles = files.filter((file) => !file.type.startsWith("image/"));

    if (invalidFiles.length > 0) {
      setMessage("Please select only image files.");
      setMessageType("error");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    const newImages = files.map((file) => URL.createObjectURL(file));
    setSelectedImages([...selectedImages, ...files]);
    setImagePreviews([...imagePreviews, ...newImages]);
  };

  const handleRemoveNewImage = (index: number) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
    setImagePreviews(updatedPreviews);
  };

  const handleRemoveExistingImage = async (index: number) => {
    setDeleteType("image");
    setDeleteIndex(index);
    setImageToDelete(`data:image/jpeg;base64,${sparePart.photo[index]}`);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteSparePart = () => {
    setDeleteType("sparePart");
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (deleteType === "image") {
      setIsBreaking(true);
      setTimeout(async () => {
        try {
          await apiClient.delete(
            `/sparePartManagement/delete/${id}?photoIndex=${deleteIndex}`,
            {
              headers: { "Content-Type": "application/json" },
            }
          );

          const updatedPhotos = sparePart.photo.filter(
            (_, i) => i !== deleteIndex
          );
          setSparePart({ ...sparePart, photo: updatedPhotos });

          setShowDeleteConfirmation(false);
          setIsBreaking(false);

          setMessage("Image deleted successfully.");
          setMessageType("success");
          setShowMessage(true);
          setTimeout(() => setShowMessage(false), 2000);
        } catch (err) {
          console.error("Error deleting:", err);
          setMessage("Failed to delete image.");
          setMessageType("error");
          setShowMessage(true);
          setTimeout(() => setShowMessage(false), 3000);
        }
      }, 1000);
    } else if (deleteType === "sparePart") {
      try {
        await apiClient.delete(`/sparePartManagement/delete/${id}`);
        setShowDeleteConfirmation(false);
        setMessage("Spare part deleted successfully.");
        setMessageType("success");
        setShowMessage(true);
        setTimeout(() => {
          setShowMessage(false);
          navigate("/getAll"); 
        }, 2000);
      } catch (err) {
        console.error("Error deleting spare part:", err);
        setMessage("Failed to delete spare part.");
        setMessageType("error");
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      }
    }
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("partName", sparePart.partName ?? "");
      formData.append("description", sparePart.description ?? "");
      formData.append("manufacturer", sparePart.manufacturer ?? "");
      formData.append("price", Number(sparePart.price || 0).toString());
      formData.append("partNumber", sparePart.partNumber ?? "");
      formData.append("sGST", Number(sparePart.sGST || 0).toString());
      formData.append("cGST", Number(sparePart.cGST || 0).toString());
      formData.append("totalGST", Number(sparePart.totalGST || 0).toString());
      formData.append("buyingPrice", Number(sparePart.buyingPrice || 0).toString());

      selectedImages.forEach((file) => {
        formData.append("photos", file);
      });

      const response = await apiClient.patch(
        `/sparePartManagement/update/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data) {
        setSparePart({
          ...response.data,
          price: response.data.price?.toString() || "",
          sGST: response.data.sgst?.toString() || "",   
          cGST: response.data.cgst?.toString() || "",   
          totalGST: response.data.totalGST?.toString() || "", 
          buyingPrice: response.data.buyingPrice?.toString() || "",
          partNumber: response.data.partNumber || "",
          photo: response.data.photo || [],
        });
      }

      setMessage("Spare part updated successfully.");
      setMessageType("success");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2000);

      navigate(`/spare-part/${id}`);
    } catch (err) {
      console.error("Error updating spare part:", err);
      setMessage("Failed to update spare part.");
      setMessageType("error");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  };

  const handleUpdate = async () => {
    await handleSave();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setSparePart({ ...sparePart, [name]: value });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-500 py-4 bg-white p-6 rounded-lg shadow-md">
        {error}
      </p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-200 p-4 md:p-6"
    >
     
      <div className="mb-6 flex items-center justify-between">
        <button
          className="flex items-center gap-2 text-gray-700 hover:text-black transition duration-300"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={24} />
          <span className="text-lg font-semibold">Back</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Edit Spare Part</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <div className="bg-white p-6 md:p-8 shadow-lg rounded-lg border border-gray-100 flex-1">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
            Photos
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {sparePart.photo.map((photo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="relative w-full bg-gray-200 rounded-lg shadow-md overflow-hidden transition duration-300">
                  <img
                    src={`data:image/jpeg;base64,${photo}`}
                    alt={`Existing Photo ${index}`}
                    className="w-full h-auto object-contain max-h-[300px]"
                  />
                  <button
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-300"
                    onClick={() => handleRemoveExistingImage(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="mx-4 text-gray-500">OR</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Preview New Images
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {imagePreviews.map((preview, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <div className="relative w-full bg-gray-200 rounded-lg shadow-md overflow-hidden transition duration-300">
                    <img
                      src={preview}
                      alt={`Preview ${index}`}
                      className="w-full h-auto object-contain max-h-[300px]"
                    />
                    <button
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-300"
                      onClick={() => handleRemoveNewImage(index)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Upload More Images
            </label>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <input
                type="file"
                multiple
                onChange={handleImageChange}
                className="w-full md:flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 bg-white text-black"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full md:w-auto flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300"
                onClick={handleUpdate}
              >
                <Upload size={20} />
                <span className="text-base font-medium">Update</span>
              </motion.button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 shadow-lg rounded-lg border border-gray-100 flex-1">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
            Edit Details
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Part Name
              </label>
              <input
                type="text"
                name="partName"
                value={sparePart.partName || ""}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 bg-white text-black"
                placeholder="Enter spare part name"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={sparePart.description || ""}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 bg-white text-black"
                placeholder="Enter a detailed description"
                rows={4}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Manufacturer
              </label>
              <input
                type="text"
                name="manufacturer"
                value={sparePart.manufacturer || ""}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 bg-white text-black"
                placeholder="Enter manufacturer name"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Selling Price
              </label>
              <input
                type="number"
                name="price"
                value={sparePart.price}
                onChange={handleChange}
                min="0"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 bg-white text-black"
                placeholder="Enter selling price"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Part Number
              </label>
              <input
                type="text"
                name="partNumber"
                value={sparePart.partNumber || ""}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 bg-white text-black"
                placeholder="Enter part number"
              />
            </div>
           
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  SGST (%)
                </label>
                <input
                  type="number"
                  name="sGST"
                  value={sparePart.sGST}
                  onChange={handleChange}
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 bg-white text-black"
                  placeholder="e.g., 9"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  CGST (%)
                </label>
                <input
                  type="number"
                  name="cGST"
                  value={sparePart.cGST}
                  onChange={handleChange}
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 bg-white text-black"
                  placeholder="e.g., 9"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Total GST (%)
                </label>
                <input
                  type="number"
                  name="totalGST" 
                  value={sparePart.totalGST}
                  onChange={handleChange}
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 bg-white text-black"
                  placeholder="e.g., 18"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Buying Price (INR)
                </label>
                <input
                  type="number"
                  name="buyingPrice"
                  value={sparePart.buyingPrice}
                  onChange={handleChange}
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300 bg-white text-black"
                  placeholder="Enter buying price"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 w-full justify-center"
              onClick={handleSave}
            >
              <Save size={20} />
              <span className="text-base font-medium">Save Changes</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300 w-full justify-center"
              onClick={handleDeleteSparePart}
            >
              <Trash2 size={20} />
              <span className="text-base font-medium">Delete Spare Part</span>
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center"
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: isBreaking ? 0 : 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-6 rounded-lg shadow-lg text-gray-800 max-w-sm w-full"
            >
              <h2 className="text-xl font-bold mb-4">
                Are you sure you want to delete this?
              </h2>
              {deleteType === "image" && imageToDelete && (
                <div className="relative w-full bg-gray-200 rounded-lg shadow-md overflow-hidden mb-4">
                  <img
                    src={imageToDelete}
                    alt="Image to delete"
                    className="w-full h-auto object-contain max-h-[300px]"
                  />
                </div>
              )}
              <p className="mb-6">This action cannot be undone.</p>
              <div className="flex gap-4">
                <button
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-300"
                  onClick={confirmDelete}
                >
                  Delete
                </button>
                <button
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition duration-300"
                  onClick={() => setShowDeleteConfirmation(false)}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
              messageType === "success"
                ? "bg-green-500 text-white"
                : messageType === "error"
                ? "bg-red-500 text-white"
                : "bg-yellow-500 text-black"
            }`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default EditSparePart;
