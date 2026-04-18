import apiClient from './apiClient';

export const supplierService = {
  // Get all critical suppliers
  getAll: () => apiClient.get('/suppliers'),
  
  // Get active suppliers
  getActive: () => apiClient.get('/suppliers?status=activo'),
  
  // Get single supplier
  getById: (id) => apiClient.get(`/suppliers/${id}`),
  
  // Create supplier
  create: (data) => apiClient.post('/suppliers', data),
  
  // Update supplier
  update: (id, data) => apiClient.put(`/suppliers/${id}`, data),
  
  // Delete supplier
  delete: (id) => apiClient.delete(`/suppliers/${id}`),
};

export const completionService = {
  // Get all completion records
  getAll: () => apiClient.get('/completions'),
  
  // Get completions for a supplier
  getBySupplier: (supplierId) => apiClient.get(`/completions/supplier/${supplierId}`),
  
  // Create completion record
  create: (data) => apiClient.post('/completions', data),
  
  // Batch create completions
  createBatch: (data) => apiClient.post('/completions/batch', data),
};

export const uploadService = {
  // Upload file
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Process uploaded file
  processFile: (fileId) => apiClient.post(`/uploads/${fileId}/process`),
  
  // Get upload status
  getStatus: (fileId) => apiClient.get(`/uploads/${fileId}/status`),
};

export default {
  supplier: supplierService,
  completion: completionService,
  upload: uploadService,
};
