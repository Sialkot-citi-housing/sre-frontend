const fs = require('fs');
const path = 'c:/My working/HamidTech_Ventures/Clients/Sialkot Real Estate/sialkot-build-manager/src/routes/projects.$projectId.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /financeActions\.addCustomerPayment\(\{\s+projectId: project\.id,\s+date: String\(v\.date\),\s+amount: Number\(v\.amount\) \|\| 0,\s+method: v\.method as PaymentMethod,\s+note: String\(v\.note \?\? ""\),\s+\}\)/,
  `api.addCustomerPayment({ project: project._id, date: String(v.date), amount: Number(v.amount) || 0, method: v.method, note: String(v.note ?? "") }).then(() => { queryClient.invalidateQueries({ queryKey: ["payments"] }); toast.success("Payment recorded"); }).catch(e => toast.error(e.message))`
);

fs.writeFileSync(path, content);
console.log("Fixed addCustomerPayment");
