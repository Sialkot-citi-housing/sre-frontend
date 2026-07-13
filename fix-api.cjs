const fs = require('fs');
const path = 'c:/My working/HamidTech_Ventures/Clients/Sialkot Real Estate/sialkot-build-manager/src/routes/projects.$projectId.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace addProcurement
content = content.replace(
  /financeActions\.addProcurement\(\{\s+projectId: project\.id,\s+date: String\(v\.date\),\s+item: String\(v\.item\),\s+category: v\.category as MaterialCategory,\s+quantity: Number\(v\.quantity\) \|\| 0,\s+unit: String\(v\.unit\),\s+rate: Number\(v\.rate\) \|\| 0,\s+vendor: String\(v\.vendor\),\s+paid: Number\(v\.paid\) \|\| 0,\s+\}\)/,
  `api.addProcurement({ project: project._id, date: String(v.date), item: String(v.item), category: v.category, quantity: Number(v.quantity) || 0, unit: String(v.unit), rate: Number(v.rate) || 0, vendor: String(v.vendor), paid: Number(v.paid) || 0 }).then(() => { queryClient.invalidateQueries({ queryKey: ["procurements"] }); toast.success("Procurement added"); }).catch(e => toast.error(e.message))`
);

// Replace addContractor
content = content.replace(
  /financeActions\.addContractor\(\{\s+projectId: project\.id,\s+role: v\.role as ContractorRole,\s+name: String\(v\.name\),\s+contact: String\(v\.contact\),\s+agreedAmount: Number\(v\.agreedAmount\) \|\| 0,\s+status: v\.status as Contractor\["status"\],\s+\}\)/,
  `api.addContractor({ project: project._id, role: v.role, name: String(v.name), contact: String(v.contact), agreedAmount: Number(v.agreedAmount) || 0, status: v.status }).then(() => { queryClient.invalidateQueries({ queryKey: ["contractors"] }); toast.success("Contractor added"); }).catch(e => toast.error(e.message))`
);

// Replace addContractorPayment
content = content.replace(
  /financeActions\.addContractorPayment\(\{\s+contractorId: c\.id,\s+date: String\(v\.date\),\s+amount: Number\(v\.amount\) \|\| 0,\s+note: String\(v\.note \?\? ""\),\s+\}\)/,
  `api.addContractorPayment({ contractor: c._id || c.id, project: project._id, date: String(v.date), amount: Number(v.amount) || 0, note: String(v.note ?? "") }).then(() => { queryClient.invalidateQueries({ queryKey: ["payments"] }); toast.success("Payment recorded"); }).catch(e => toast.error(e.message))`
);

// Replace onSave updates
content = content.replace(
  /financeActions\.updateProcurement\(editProcurementId, next as unknown as Partial<Procurement>\);/,
  `api.updateProcurement(editProcurementId, next).then(() => { queryClient.invalidateQueries({ queryKey: ["procurements"] }); setEditProcurementId(null); toast.success("Updated"); }).catch(e => toast.error(e.message));`
);

content = content.replace(
  /financeActions\.updateContractor\(editContractorId, next as unknown as Partial<Contractor>\);/,
  `api.updateContractor(editContractorId, next).then(() => { queryClient.invalidateQueries({ queryKey: ["contractors"] }); setEditContractorId(null); toast.success("Updated"); }).catch(e => toast.error(e.message));`
);

content = content.replace(
  /financeActions\.updateContractorPayment\(editContractorPaymentId, next as unknown as Partial<ContractorPayment>\);/,
  `api.updateContractorPayment(editContractorPaymentId, next).then(() => { queryClient.invalidateQueries({ queryKey: ["payments"] }); setEditContractorPaymentId(null); toast.success("Updated"); }).catch(e => toast.error(e.message));`
);

content = content.replace(
  /financeActions\.updateCustomerPayment\(editCustomerPaymentId, next as unknown as Partial<CustomerPayment>\);/,
  `api.updateCustomerPayment(editCustomerPaymentId, next).then(() => { queryClient.invalidateQueries({ queryKey: ["payments"] }); setEditCustomerPaymentId(null); toast.success("Updated"); }).catch(e => toast.error(e.message));`
);

// Need to also replace addCustomerPayment
content = content.replace(
  /financeActions\.addCustomerPayment\(\{\s+projectId: project\.id,\s+date: String\(v\.date\),\s+amount: Number\(v\.amount\) \|\| 0,\s+method: v\.method as PaymentMethod,\s+note: String\(v\.note \?\? ""\),\s+\}\)/,
  `api.addCustomerPayment({ project: project._id, date: String(v.date), amount: Number(v.amount) || 0, method: v.method, note: String(v.note ?? "") }).then(() => { queryClient.invalidateQueries({ queryKey: ["payments"] }); toast.success("Payment recorded"); }).catch(e => toast.error(e.message))`
);

fs.writeFileSync(path, content);
console.log("Replaced financeActions with API calls");
