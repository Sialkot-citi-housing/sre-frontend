let rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Remove trailing slashes
rawBase = rawBase.replace(/\/+$/, '');
// Append /api if missing to prevent double slashes or missing routes
if (!rawBase.endsWith('/api')) {
  rawBase = `${rawBase}/api`;
}
export const BASE_URL = rawBase;

const getHeaders = () => {
  const token = localStorage.getItem('sre_auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    let errorMsg = 'API request failed';
    try {
      const error = await res.json();
      errorMsg = error.message || errorMsg;
    } catch (e) {
      // If response is not JSON (e.g. 500 HTML page)
      const text = await res.text().catch(() => "");
      console.error("API Error Response Text:", text);
      errorMsg = text ? `Server Error: ${text.substring(0, 100)}...` : errorMsg;
    }
    throw new Error(errorMsg);
  }
  return res.json();
};

export const api = {
  // Projects
  getProjects: () => fetch(`${BASE_URL}/projects`, { headers: getHeaders() }).then(handleResponse),
  getProjectById: (id: string) => fetch(`${BASE_URL}/projects/${id}`, { headers: getHeaders() }).then(handleResponse),
  createProject: (data: any) => fetch(`${BASE_URL}/projects`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  updateProject: (id: string, data: any) => fetch(`${BASE_URL}/projects/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  deleteProject: (id: string) => fetch(`${BASE_URL}/projects/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Procurements
  getAllProcurements: () => fetch(`${BASE_URL}/procurements`, { headers: getHeaders() }).then(handleResponse),
  getProcurementsByProject: (projectId: string) => fetch(`${BASE_URL}/procurements/project/${projectId}`, { headers: getHeaders() }).then(handleResponse),
  addProcurement: (data: any) => fetch(`${BASE_URL}/procurements`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  updateProcurement: (id: string, data: any) => fetch(`${BASE_URL}/procurements/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  deleteProcurement: (id: string) => fetch(`${BASE_URL}/procurements/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Contractors
  getAllContractors: () => fetch(`${BASE_URL}/contractors`, { headers: getHeaders() }).then(handleResponse),
  getContractorsByProject: (projectId: string) => fetch(`${BASE_URL}/contractors/project/${projectId}`, { headers: getHeaders() }).then(handleResponse),
  addContractor: (data: any) => fetch(`${BASE_URL}/contractors`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  updateContractor: (id: string, data: any) => fetch(`${BASE_URL}/contractors/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  deleteContractor: (id: string) => fetch(`${BASE_URL}/contractors/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Payments
  getPaymentsByProject: (projectId: string) => fetch(`${BASE_URL}/payments/project/${projectId}`, { headers: getHeaders() }).then(handleResponse),
  getAllContractorPayments: () => fetch(`${BASE_URL}/payments/contractor`, { headers: getHeaders() }).then(handleResponse),
  addContractorPayment: (data: any) => fetch(`${BASE_URL}/payments/contractor`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  updateContractorPayment: (id: string, data: any) => fetch(`${BASE_URL}/payments/contractor/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  deleteContractorPayment: (id: string) => fetch(`${BASE_URL}/payments/contractor/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
  addCustomerPayment: (data: any) => fetch(`${BASE_URL}/payments/customer`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  updateCustomerPayment: (id: string, data: any) => fetch(`${BASE_URL}/payments/customer/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  deleteCustomerPayment: (id: string) => fetch(`${BASE_URL}/payments/customer/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Funds & Office Expenses
  getFunds: () => fetch(`${BASE_URL}/funds`, { headers: getHeaders() }).then(handleResponse),
  addFund: (data: any) => fetch(`${BASE_URL}/funds`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  
  getOfficeExpenses: () => fetch(`${BASE_URL}/office-expenses`, { headers: getHeaders() }).then(handleResponse),
  addOfficeExpense: (data: any) => fetch(`${BASE_URL}/office-expenses`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  updateOfficeExpense: (id: string, data: any) => fetch(`${BASE_URL}/office-expenses/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  deleteOfficeExpense: (id: string) => fetch(`${BASE_URL}/office-expenses/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Invoices
  getInvoices: () => fetch(`${BASE_URL}/invoices`, { headers: getHeaders() }).then(handleResponse),
  createInvoice: (data: any) => fetch(`${BASE_URL}/invoices`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  updateInvoice: (id: string, data: any) => fetch(`${BASE_URL}/invoices/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) }).then(handleResponse),
  deleteInvoice: (id: string) => fetch(`${BASE_URL}/invoices/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
};
