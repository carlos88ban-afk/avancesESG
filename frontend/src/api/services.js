import apiClient from './apiClient';

export const supplierService = {
  // Get all critical suppliers
  getAll: () => apiClient.get('/api/suppliers'),
  
  // Get active suppliers
  getActive: () => apiClient.get('/api/suppliers?status=activo'),
  
  // Search proveedores_criticos base table by name or RUC (ILIKE)
  search: (q) => apiClient.get(`/api/suppliers/search?q=${encodeURIComponent(q)}`),

  // Get single supplier
  getById: (id) => apiClient.get(`/api/suppliers/${id}`),
  
  // Create supplier
  create: (data) => apiClient.post('/api/suppliers', data),
  
  // Update supplier
  update: (id, data) => apiClient.put(`/api/suppliers/${id}`, data),
  
  // Delete supplier
  delete: (id) => apiClient.delete(`/api/suppliers/${id}`),
};

export const completionService = {
  // Get all completion records
  getAll: () => apiClient.get('/api/completions'),
  
  // Get completions for a supplier
  getBySupplier: (supplierId) => apiClient.get(`/api/completions/supplier/${supplierId}`),
  
  // Create completion record
  create: (data) => apiClient.post('/api/completions', data),
  
  // Batch create completions
  createBatch: (data) => apiClient.post('/api/completions/batch', data),

  // Re-run matching engine against all existing proveedores records
  rematch: () => apiClient.post('/api/completions/rematch'),
};

export const progressService = {
  getAll: () => apiClient.get('/api/progress'),
};

export const dashboardService = {
  getMetrics: () => apiClient.get('/api/dashboard/metrics'),
};

export const evaluacionService = {
  getAll: () => apiClient.get('/api/evaluacion'),
};

export const uploadService = {
  // Upload file
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/api/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  // Process uploaded file
  processFile: (fileId) => apiClient.post(`/api/uploads/${fileId}/process`),
  
  // Get upload status
  getStatus: (fileId) => apiClient.get(`/api/uploads/${fileId}/status`),
};

export default {
  supplier: supplierService,
  completion: completionService,
  upload: uploadService,
};
