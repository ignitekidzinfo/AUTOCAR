import React, { useEffect, useState } from 'react';
import apiClient from 'Services/apiService';

interface InvoiceItem {
  id: number;
  spareName: string;
  spareNo: string;
  quantity: number;
  rate: number;
  discountPercent: number;
  discountAmt: number;
  taxableValue: number;
  cgstPercent: number;
  amount: number;
  sgstPercent: number;
  cgstAmt: number;
  sgstAmt: number;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  invDate: string;
  customerName: string;
  customerAddress: string;
  customerMobile: string;
  adharNo: string;
  gstin: string;
  vehicleNo: string;
  totalAmount: number;
  discount: number;
  netTotal: number;
  items: InvoiceItem[];
}

const ReportForm: React.FC = () => {
  const calculate = (tableId: string): void => {
    const slabs: number[] = [0, 5, 12, 18, 28];
    let grand: number = 0;
    let totalPrice: number = 0;

    slabs.forEach((s) => {
      ['taxable', 'cgst', 'sgst', 'igst'].forEach((k) => {
        const elem = document.getElementById(`${tableId}_${k}_${s}`);
        if (elem) elem.textContent = '0.00';
      });
    });

    const interstate: boolean = false;
    const rows = document.querySelectorAll<HTMLTableRowElement>(`#${tableId}_tableBody tr`);

    rows.forEach((row) => {
      const priceInput = row.cells[8].querySelector('input') as HTMLInputElement;
      const rateInput = row.cells[10].querySelector('input') as HTMLInputElement;
      if (!priceInput || !rateInput) return;
      
      const price: number = +priceInput.value || 0;
      const rate: number = +rateInput.value || 0;
      if (!slabs.includes(rate)) return;

      let cgst = 0,
        sgst = 0,
        igst = 0;
      if (rate > 0) {
        const amt: number = (price * rate) / 100;
        if (interstate) {
          igst = amt;
        } else {
          cgst = amt / 2;
          sgst = amt / 2;
        }
      }

      const idx: number = slabs.indexOf(rate);
      const base: number = 11 + idx * 4;
      if (row.cells[base]) row.cells[base].textContent = price.toFixed(2);
      if (row.cells[base + 1]) row.cells[base + 1].textContent = cgst.toFixed(2);
      if (row.cells[base + 2]) row.cells[base + 2].textContent = sgst.toFixed(2);
      if (row.cells[base + 3]) row.cells[base + 3].textContent = igst.toFixed(2);

      ['taxable', 'cgst', 'sgst', 'igst'].forEach((k, i) => {
        const el = document.getElementById(`${tableId}_${k}_${rate}`);
        if (el) {
          const current: number = +el.textContent!;
          el.textContent = (current + [price, cgst, sgst, igst][i]).toFixed(2);
        }
      });

      const rowTotal: number = price + cgst + sgst + igst;
      if (row.cells[9]) row.cells[9].textContent = rowTotal.toFixed(2);
      grand += rowTotal;
      totalPrice += price;
    });

    const totalAmountElem = document.getElementById(`${tableId}_totalAmount`);
    if (totalAmountElem) totalAmountElem.textContent = grand.toFixed(2);
    const totalPriceElem = document.getElementById(`${tableId}_totalPrice`);
    if (totalPriceElem) totalPriceElem.textContent = totalPrice.toFixed(2);
  };

  const filterCounterSalesRows = async (): Promise<void> => {
    const fromDate = (document.getElementById('fromDate') as HTMLInputElement).value;
    const toDate = (document.getElementById('toDate') as HTMLInputElement).value;
    
    if (!fromDate || !toDate) {
      alert('Please select both From Date and Till Date');
      return;
    }

    try {
      const response = await apiClient.get(`/api/invoices/dateRange`, {
        params: {
          from: fromDate,
          to: toDate
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        const invoices: Invoice[] = response.data;
        const tbody = document.getElementById('counter_tableBody') as HTMLTableSectionElement;
        if (!tbody) return;

      tbody.innerHTML = ''; 
        let rowIndex = 1;

        const invoiceMap: Record<string, {
          invoice: Invoice,
          totalAmount: number,
          totalTaxable: number,
          totalCGST: number,
          totalSGST: number,
          totalIGST: number,
          gst5: { amount: number, taxable: number, cgst: number, sgst: number, igst: number },
          gst12: { amount: number, taxable: number, cgst: number, sgst: number, igst: number },
          gst18: { amount: number, taxable: number, cgst: number, sgst: number, igst: number },
          gst28: { amount: number, taxable: number, cgst: number, sgst: number, igst: number }
        }> = {};

        invoices.forEach((invoice) => {
          if (!invoiceMap[invoice.invoiceNumber]) {
            invoiceMap[invoice.invoiceNumber] = {
              invoice,
              totalAmount: 0,
              totalTaxable: 0,
              totalCGST: 0,
              totalSGST: 0,
              totalIGST: 0,
              gst5: { amount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 },
              gst12: { amount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 },
              gst18: { amount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 },
              gst28: { amount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 }
            };
          }
          invoice.items.forEach((item) => {
            const gstRate = item.cgstPercent + item.sgstPercent;
            const totalGstAmt = item.cgstAmt + item.sgstAmt;
            const taxableAmount = item.amount - totalGstAmt;
            
            invoiceMap[invoice.invoiceNumber].totalAmount += item.amount;
            invoiceMap[invoice.invoiceNumber].totalTaxable += taxableAmount;
            invoiceMap[invoice.invoiceNumber].totalCGST += item.cgstAmt;
            invoiceMap[invoice.invoiceNumber].totalSGST += item.sgstAmt;
            
            if (gstRate === 5) {
              invoiceMap[invoice.invoiceNumber].gst5.amount += item.amount;
              invoiceMap[invoice.invoiceNumber].gst5.taxable += taxableAmount;
              invoiceMap[invoice.invoiceNumber].gst5.cgst += item.cgstAmt;
              invoiceMap[invoice.invoiceNumber].gst5.sgst += item.sgstAmt;
            } else if (gstRate === 12) {
              invoiceMap[invoice.invoiceNumber].gst12.amount += item.amount;
              invoiceMap[invoice.invoiceNumber].gst12.taxable += taxableAmount;
              invoiceMap[invoice.invoiceNumber].gst12.cgst += item.cgstAmt;
              invoiceMap[invoice.invoiceNumber].gst12.sgst += item.sgstAmt;
            } else if (gstRate === 18) {
              invoiceMap[invoice.invoiceNumber].gst18.amount += item.amount;
              invoiceMap[invoice.invoiceNumber].gst18.taxable += taxableAmount;
              invoiceMap[invoice.invoiceNumber].gst18.cgst += item.cgstAmt;
              invoiceMap[invoice.invoiceNumber].gst18.sgst += item.sgstAmt;
            } else if (gstRate === 28) {
              invoiceMap[invoice.invoiceNumber].gst28.amount += item.amount;
              invoiceMap[invoice.invoiceNumber].gst28.taxable += taxableAmount;
              invoiceMap[invoice.invoiceNumber].gst28.cgst += item.cgstAmt;
              invoiceMap[invoice.invoiceNumber].gst28.sgst += item.sgstAmt;
            }
          });
        });
        Object.values(invoiceMap).forEach((invoiceData) => {
          const { invoice, totalAmount, totalTaxable, totalCGST, totalSGST, totalIGST, 
                  gst5, gst12, gst18, gst28 } = invoiceData;
          
          const row = document.createElement('tr');
        row.innerHTML = `
            <td>${rowIndex}</td>
            <td>${invoice.invDate}</td>
            <td>${invoice.customerName}</td>
            <td>Sale</td>
            <td>Maharashtra</td>
            <td>${invoice.invoiceNumber}</td>
            <td>${invoice.gstin || '-'}</td>
            <td>${parseFloat(totalAmount.toFixed(2))}</td>
            <td>${parseFloat(totalTaxable.toFixed(2))}</td>
            <td>${parseFloat(totalCGST.toFixed(2))}</td>
            <td>${parseFloat(totalSGST.toFixed(2))}</td>
            <td>${parseFloat(totalIGST.toFixed(2))}</td>
          <td>0.00</td>
            <td>${parseFloat(gst5.amount.toFixed(2))}</td>
            <td>${parseFloat(gst5.taxable.toFixed(2))}</td>
            <td>${parseFloat(gst5.cgst.toFixed(2))}</td>
            <td>${parseFloat(gst5.sgst.toFixed(2))}</td>
            <td>0.00</td>
            <td>${parseFloat(gst12.amount.toFixed(2))}</td>
            <td>${parseFloat(gst12.taxable.toFixed(2))}</td>
            <td>${parseFloat(gst12.cgst.toFixed(2))}</td>
            <td>${parseFloat(gst12.sgst.toFixed(2))}</td>
            <td>0.00</td>
            <td>${parseFloat(gst18.amount.toFixed(2))}</td>
            <td>${parseFloat(gst18.taxable.toFixed(2))}</td>
            <td>${parseFloat(gst18.cgst.toFixed(2))}</td>
            <td>${parseFloat(gst18.sgst.toFixed(2))}</td>
            <td>0.00</td>
            <td>${parseFloat(gst28.amount.toFixed(2))}</td>
            <td>${parseFloat(gst28.taxable.toFixed(2))}</td>
            <td>${parseFloat(gst28.cgst.toFixed(2))}</td>
            <td>${parseFloat(gst28.sgst.toFixed(2))}</td>
            <td>0.00</td>
        `;
        tbody.appendChild(row);
          rowIndex++;
        });
        
        calculateTotals('counter'); 
      } else {
        alert('No invoices found for the selected date range');
      }
    } catch (error) {
      console.error('Error fetching counter sales invoices:', error);
      alert('Error fetching invoices. Please try again.');
    }
  };

  const filterJobSalesRows = async (): Promise<void> => {
    const fromDate = (document.getElementById('fromDate') as HTMLInputElement).value;
    const toDate = (document.getElementById('toDate') as HTMLInputElement).value;
    
    if (!fromDate || !toDate) {
      alert('Please select both From Date and Till Date');
      return;
    }

    try {
      const response = await apiClient.get(`/api/vehicle-invoices/search/date-range`, {
        params: {
          startDateStr: fromDate,
          endDateStr: toDate
        }
      });
      
      if (response.data && Array.isArray(response.data)) {
        const invoices = response.data;
        const tbody = document.getElementById('job_tableBody') as HTMLTableSectionElement;
        if (!tbody) return;

        tbody.innerHTML = ''; 
        let rowIndex = 1;

        const invoiceMap: Record<string, {
          invoice: any,
          totalAmount: number,
          totalTaxable: number,
          totalCGST: number,
          totalSGST: number,
          totalIGST: number,
          gst5: { amount: number, taxable: number, cgst: number, sgst: number, igst: number },
          gst12: { amount: number, taxable: number, cgst: number, sgst: number, igst: number },
          gst18: { amount: number, taxable: number, cgst: number, sgst: number, igst: number },
          gst28: { amount: number, taxable: number, cgst: number, sgst: number, igst: number }
        }> = {};

        invoices.forEach((invoice: any) => {
          if (!invoiceMap[invoice.invoiceNumber]) {
            invoiceMap[invoice.invoiceNumber] = {
              invoice,
              totalAmount: 0,
              totalTaxable: 0,
              totalCGST: 0,
              totalSGST: 0,
              totalIGST: 0,
              gst5: { amount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 },
              gst12: { amount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 },
              gst18: { amount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 },
              gst28: { amount: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0 }
            };
          }
          if (invoice.parts && Array.isArray(invoice.parts)) {
            invoice.parts.forEach((part: any) => {
              const gstRate = part.cgstPercent + part.sgstPercent;
              
              invoiceMap[invoice.invoiceNumber].totalAmount += part.totalAmount;
              invoiceMap[invoice.invoiceNumber].totalTaxable += part.taxableAmount;
              invoiceMap[invoice.invoiceNumber].totalCGST += part.cgstAmount;
              invoiceMap[invoice.invoiceNumber].totalSGST += part.sgstAmount;
              invoiceMap[invoice.invoiceNumber].totalIGST += (part.igstAmount || 0);
              
              if (gstRate === 5) {
                invoiceMap[invoice.invoiceNumber].gst5.amount += part.totalAmount;
                invoiceMap[invoice.invoiceNumber].gst5.taxable += part.taxableAmount;
                invoiceMap[invoice.invoiceNumber].gst5.cgst += part.cgstAmount;
                invoiceMap[invoice.invoiceNumber].gst5.sgst += part.sgstAmount;
                invoiceMap[invoice.invoiceNumber].gst5.igst += (part.igstAmount || 0);
              } else if (gstRate === 12) {
                invoiceMap[invoice.invoiceNumber].gst12.amount += part.totalAmount;
                invoiceMap[invoice.invoiceNumber].gst12.taxable += part.taxableAmount;
                invoiceMap[invoice.invoiceNumber].gst12.cgst += part.cgstAmount;
                invoiceMap[invoice.invoiceNumber].gst12.sgst += part.sgstAmount;
                invoiceMap[invoice.invoiceNumber].gst12.igst += (part.igstAmount || 0);
              } else if (gstRate === 18) {
                invoiceMap[invoice.invoiceNumber].gst18.amount += part.totalAmount;
                invoiceMap[invoice.invoiceNumber].gst18.taxable += part.taxableAmount;
                invoiceMap[invoice.invoiceNumber].gst18.cgst += part.cgstAmount;
                invoiceMap[invoice.invoiceNumber].gst18.sgst += part.sgstAmount;
                invoiceMap[invoice.invoiceNumber].gst18.igst += (part.igstAmount || 0);
              } else if (gstRate === 28) {
                invoiceMap[invoice.invoiceNumber].gst28.amount += part.totalAmount;
                invoiceMap[invoice.invoiceNumber].gst28.taxable += part.taxableAmount;
                invoiceMap[invoice.invoiceNumber].gst28.cgst += part.cgstAmount;
                invoiceMap[invoice.invoiceNumber].gst28.sgst += part.sgstAmount;
                invoiceMap[invoice.invoiceNumber].gst28.igst += (part.igstAmount || 0);
              }
            });
          }
          
          if (invoice.labours && Array.isArray(invoice.labours)) {
            invoice.labours.forEach((labour: any) => {
              if (labour.totalAmount > 0) {
                const gstRate = labour.cgstPercent + labour.sgstPercent;
                
                invoiceMap[invoice.invoiceNumber].totalAmount += labour.totalAmount;
                invoiceMap[invoice.invoiceNumber].totalTaxable += labour.taxableAmount;
                invoiceMap[invoice.invoiceNumber].totalCGST += labour.cgstAmount;
                invoiceMap[invoice.invoiceNumber].totalSGST += labour.sgstAmount;
                invoiceMap[invoice.invoiceNumber].totalIGST += (labour.igstAmount || 0);
                if (gstRate === 5) {
                  invoiceMap[invoice.invoiceNumber].gst5.amount += labour.totalAmount;
                  invoiceMap[invoice.invoiceNumber].gst5.taxable += labour.taxableAmount;
                  invoiceMap[invoice.invoiceNumber].gst5.cgst += labour.cgstAmount;
                  invoiceMap[invoice.invoiceNumber].gst5.sgst += labour.sgstAmount;
                  invoiceMap[invoice.invoiceNumber].gst5.igst += (labour.igstAmount || 0);
                } else if (gstRate === 12) {
                  invoiceMap[invoice.invoiceNumber].gst12.amount += labour.totalAmount;
                  invoiceMap[invoice.invoiceNumber].gst12.taxable += labour.taxableAmount;
                  invoiceMap[invoice.invoiceNumber].gst12.cgst += labour.cgstAmount;
                  invoiceMap[invoice.invoiceNumber].gst12.sgst += labour.sgstAmount;
                  invoiceMap[invoice.invoiceNumber].gst12.igst += (labour.igstAmount || 0);
                } else if (gstRate === 18) {
                  invoiceMap[invoice.invoiceNumber].gst18.amount += labour.totalAmount;
                  invoiceMap[invoice.invoiceNumber].gst18.taxable += labour.taxableAmount;
                  invoiceMap[invoice.invoiceNumber].gst18.cgst += labour.cgstAmount;
                  invoiceMap[invoice.invoiceNumber].gst18.sgst += labour.sgstAmount;
                  invoiceMap[invoice.invoiceNumber].gst18.igst += (labour.igstAmount || 0);
                } else if (gstRate === 28) {
                  invoiceMap[invoice.invoiceNumber].gst28.amount += labour.totalAmount;
                  invoiceMap[invoice.invoiceNumber].gst28.taxable += labour.taxableAmount;
                  invoiceMap[invoice.invoiceNumber].gst28.cgst += labour.cgstAmount;
                  invoiceMap[invoice.invoiceNumber].gst28.sgst += labour.sgstAmount;
                  invoiceMap[invoice.invoiceNumber].gst28.igst += (labour.igstAmount || 0);
                }
              }
            });
          }
        });

        Object.values(invoiceMap).forEach((invoiceData) => {
          const { invoice, totalAmount, totalTaxable, totalCGST, totalSGST, totalIGST, 
                  gst5, gst12, gst18, gst28 } = invoiceData;
          
          const row = document.createElement('tr');
    row.innerHTML = `
            <td>${rowIndex}</td>
            <td>${invoice.invoiceDate}</td>
            <td>${invoice.customerName}</td>
            <td>Sale</td>
            <td>Maharashtra</td>
            <td>${invoice.invoiceNumber}</td>
            <td>${invoice.customerGstin || '-'}</td>
            <td>${parseFloat(totalAmount.toFixed(2))}</td>
            <td>${parseFloat(totalTaxable.toFixed(2))}</td>
            <td>${parseFloat(totalCGST.toFixed(2))}</td>
            <td>${parseFloat(totalSGST.toFixed(2))}</td>
            <td>${parseFloat(totalIGST.toFixed(2))}</td>
      <td>0.00</td>
            <td>${parseFloat(gst5.amount.toFixed(2))}</td>
            <td>${parseFloat(gst5.taxable.toFixed(2))}</td>
            <td>${parseFloat(gst5.cgst.toFixed(2))}</td>
            <td>${parseFloat(gst5.sgst.toFixed(2))}</td>
            <td>${parseFloat(gst5.igst.toFixed(2))}</td>
            <td>${parseFloat(gst12.amount.toFixed(2))}</td>
            <td>${parseFloat(gst12.taxable.toFixed(2))}</td>
            <td>${parseFloat(gst12.cgst.toFixed(2))}</td>
            <td>${parseFloat(gst12.sgst.toFixed(2))}</td>
            <td>${parseFloat(gst12.igst.toFixed(2))}</td>
            <td>${parseFloat(gst18.amount.toFixed(2))}</td>
            <td>${parseFloat(gst18.taxable.toFixed(2))}</td>
            <td>${parseFloat(gst18.cgst.toFixed(2))}</td>
            <td>${parseFloat(gst18.sgst.toFixed(2))}</td>
            <td>${parseFloat(gst18.igst.toFixed(2))}</td>
            <td>${parseFloat(gst28.amount.toFixed(2))}</td>
            <td>${parseFloat(gst28.taxable.toFixed(2))}</td>
            <td>${parseFloat(gst28.cgst.toFixed(2))}</td>
            <td>${parseFloat(gst28.sgst.toFixed(2))}</td>
            <td>${parseFloat(gst28.igst.toFixed(2))}</td>
    `;
    tbody.appendChild(row);
          rowIndex++;
        });
        
        calculateTotals('job'); 
      } else {
        alert('No job invoices found for the selected date range');
      }
    } catch (error) {
      console.error('Error fetching job invoices:', error);
      alert('Error fetching job invoices. Please try again.');
    }
  };

  const calculateTotals = (tableId: string): void => {
    const table = document.getElementById(`${tableId}_invoiceTable`);
    if (!table) return;

    let totalSale = 0;
    let totalTaxable = 0;
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;

    const gstRates = [0, 5, 12, 18, 28];
    const gstBreakdown: Record<number, {taxable: number; cgst: number; sgst: number; igst: number}> = {};
    
    gstRates.forEach(rate => {
      gstBreakdown[rate] = {taxable: 0, cgst: 0, sgst: 0, igst: 0};
    });

    const rows = document.querySelectorAll<HTMLTableRowElement>(`#${tableId}_tableBody tr`);
    
    rows.forEach(row => {
      const totalSaleVal = parseFloat(row.cells[7].textContent || '0');
      const taxableVal = parseFloat(row.cells[8].textContent || '0');
      const cgstVal = parseFloat(row.cells[9].textContent || '0');
      const sgstVal = parseFloat(row.cells[10].textContent || '0');
      const igstVal = parseFloat(row.cells[11].textContent || '0');
      
      totalSale += totalSaleVal;
      totalTaxable += taxableVal;
      totalCGST += cgstVal;
      totalSGST += sgstVal;
      totalIGST += igstVal;

      gstBreakdown[5].taxable += parseFloat(row.cells[14].textContent || '0');
      gstBreakdown[5].cgst += parseFloat(row.cells[15].textContent || '0');
      gstBreakdown[5].sgst += parseFloat(row.cells[16].textContent || '0');
      gstBreakdown[5].igst += parseFloat(row.cells[17].textContent || '0');
      gstBreakdown[12].taxable += parseFloat(row.cells[19].textContent || '0');
      gstBreakdown[12].cgst += parseFloat(row.cells[20].textContent || '0');
      gstBreakdown[12].sgst += parseFloat(row.cells[21].textContent || '0');
      gstBreakdown[12].igst += parseFloat(row.cells[22].textContent || '0');
      gstBreakdown[18].taxable += parseFloat(row.cells[24].textContent || '0');
      gstBreakdown[18].cgst += parseFloat(row.cells[25].textContent || '0');
      gstBreakdown[18].sgst += parseFloat(row.cells[26].textContent || '0');
      gstBreakdown[18].igst += parseFloat(row.cells[27].textContent || '0');
      gstBreakdown[28].taxable += parseFloat(row.cells[29].textContent || '0');
      gstBreakdown[28].cgst += parseFloat(row.cells[30].textContent || '0');
      gstBreakdown[28].sgst += parseFloat(row.cells[31].textContent || '0');
      gstBreakdown[28].igst += parseFloat(row.cells[32].textContent || '0');
    });

    document.getElementById(`${tableId}_totalPrice`)!.textContent = totalSale.toFixed(2);
    document.getElementById(`${tableId}_totalAmount`)!.textContent = totalTaxable.toFixed(2);
    document.getElementById(`${tableId}_cgst_total`)!.textContent = totalCGST.toFixed(2);
    document.getElementById(`${tableId}_sgst_total`)!.textContent = totalSGST.toFixed(2);
    document.getElementById(`${tableId}_igst_total`)!.textContent = totalIGST.toFixed(2);
    
    gstRates.forEach(rate => {
      if (rate === 0) return; 
      
      const breakdown = gstBreakdown[rate];
      document.getElementById(`${tableId}_taxable_${rate}`)!.textContent = breakdown.taxable.toFixed(2);
      document.getElementById(`${tableId}_cgst_${rate}`)!.textContent = breakdown.cgst.toFixed(2);
      document.getElementById(`${tableId}_sgst_${rate}`)!.textContent = breakdown.sgst.toFixed(2);
      document.getElementById(`${tableId}_igst_${rate}`)!.textContent = breakdown.igst.toFixed(2);
    });
  };

  const getFormattedGstBreakdown = (item: InvoiceItem, gstRate: number, taxableAmount: number): string => {
    let output = '';

    if (gstRate === 0) {
    } else if (gstRate <= 5) {
      output += `<td>${taxableAmount.toFixed(2)}</td>`;
      output += `<td>${(item.cgstAmt).toFixed(2)}</td>`;
      output += `<td>${(item.sgstAmt).toFixed(2)}</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
    } else if (gstRate <= 12) {
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>${taxableAmount.toFixed(2)}</td>`;
      output += `<td>${(item.cgstAmt).toFixed(2)}</td>`;
      output += `<td>${(item.sgstAmt).toFixed(2)}</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
    } else if (gstRate <= 18) {
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>${taxableAmount.toFixed(2)}</td>`;
      output += `<td>${(item.cgstAmt).toFixed(2)}</td>`;
      output += `<td>${(item.sgstAmt).toFixed(2)}</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
    } else {
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>${taxableAmount.toFixed(2)}</td>`;
      output += `<td>${(item.cgstAmt).toFixed(2)}</td>`;
      output += `<td>${(item.sgstAmt).toFixed(2)}</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
    }

    return output;
  };

  const getFormattedJobGstBreakdown = (item: any, gstRate: number): string => {
    let output = '';

    if (gstRate === 0) {
    } else if (gstRate <= 5) {
      output += `<td>${item.taxableAmount.toFixed(2)}</td>`;
      output += `<td>${item.cgstAmount.toFixed(2)}</td>`;
      output += `<td>${item.sgstAmount.toFixed(2)}</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
    } else if (gstRate <= 12) {
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>${item.taxableAmount.toFixed(2)}</td>`;
      output += `<td>${item.cgstAmount.toFixed(2)}</td>`;
      output += `<td>${item.sgstAmount.toFixed(2)}</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
    } else if (gstRate <= 18) {
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>${item.taxableAmount.toFixed(2)}</td>`;
      output += `<td>${item.cgstAmount.toFixed(2)}</td>`;
      output += `<td>${item.sgstAmount.toFixed(2)}</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
    } else {
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>${item.taxableAmount.toFixed(2)}</td>`;
      output += `<td>${item.cgstAmount.toFixed(2)}</td>`;
      output += `<td>${item.sgstAmount.toFixed(2)}</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
      output += `<td>0.00</td>`;
    }

    return output;
  };

  const applyFilters = () => {
    const fromDate = (document.getElementById('fromDate') as HTMLInputElement).value;
    const toDate = (document.getElementById('toDate') as HTMLInputElement).value;
    
    if (!fromDate) {
      alert('Please select From Date');
      return;
    }
    
    if (!toDate) {
      alert('Please select To Date');
      return;
    }
    
    filterCounterSalesRows();
    filterJobSalesRows();
  };

  const getGstColumns = (item: InvoiceItem, prefix: string): string => {
    const gstRate = item.cgstPercent + item.sgstPercent;
    const taxableAmount = item.amount - (item.cgstAmt + item.sgstAmt);
    
    const gstColumns: Record<string, { taxable: string; cgst: string; sgst: string; igst: string; }> = {
      '0': { taxable: '0.00', cgst: '0.00', sgst: '0.00', igst: '0.00' },
      '5': { taxable: '0.00', cgst: '0.00', sgst: '0.00', igst: '0.00' },
      '12': { taxable: '0.00', cgst: '0.00', sgst: '0.00', igst: '0.00' },
      '18': { taxable: '0.00', cgst: '0.00', sgst: '0.00', igst: '0.00' },
      '28': { taxable: '0.00', cgst: '0.00', sgst: '0.00', igst: '0.00' }
    };
    const slabs = [0, 5, 12, 18, 28];
    const closestSlab = slabs.reduce((prev, curr) => 
      Math.abs(curr - gstRate) < Math.abs(prev - gstRate) ? curr : prev
    );
    gstColumns[closestSlab.toString()] = {
      taxable: parseFloat(taxableAmount.toFixed(2)).toString(),
      cgst: parseFloat(item.cgstAmt.toFixed(2)).toString(),
      sgst: parseFloat(item.sgstAmt.toFixed(2)).toString(),
      igst: '0.00'
    };

    return Object.values(gstColumns).map(rate => `
      <td>${rate.taxable}</td>
      <td>${rate.cgst}</td>
      <td>${rate.sgst}</td>
      <td>${rate.igst}</td>
    `).join('');
  };

  const exportTableToCSV = (tableId: string): void => {
    const table = document.getElementById(`${tableId}_invoiceTable`) as HTMLTableElement;
    if (!table) return;
    
    let csv: string[] = [];
    for (let row of Array.from(table.rows)) {
      const cols: string[] = Array.from(row.cells).map((td) => {
        const inputElem = td.querySelector('input') as HTMLInputElement | null;
        return (inputElem ? inputElem.value : td.innerText) || '';
      });
      csv.push(cols.join(','));
    }
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${tableId}_invoice.csv`;
    a.click();
  };

  const exportAllToExcel = (): void => {
    const counterTable = document.getElementById('counter_invoiceTable') as HTMLTableElement;
    const jobTable = document.getElementById('job_invoiceTable') as HTMLTableElement;
    
    if (!counterTable || !jobTable) return;
    
    let csv: string[] = [];
    
    csv.push('Counter Sale Report,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,');
    csv.push(',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,');
    
    const counterHeaders: string[] = [];
    Array.from(counterTable.rows[0].cells).forEach(cell => {
      counterHeaders.push(cell.textContent || '');
    });
    csv.push(counterHeaders.join(','));
    
    const counterRows = Array.from(counterTable.querySelectorAll<HTMLTableRowElement>('tbody tr'));
    
    counterRows.forEach(row => {
      const cols: string[] = Array.from(row.cells).map(td => {
        const inputElem = td.querySelector('input') as HTMLInputElement | null;
        return (inputElem ? inputElem.value : td.textContent || '');
      });
      csv.push(cols.join(','));
    });
    
    const counterFooter = counterTable.querySelector<HTMLTableRowElement>('tfoot tr');
    if (counterFooter) {
      const totalRow = Array(33).fill('');
      totalRow[6] = 'Total';
      
      const footerCells = Array.from(counterFooter.cells).map(td => td.textContent || '');
      
      for (let i = 7; i < counterHeaders.length; i++) {
        const footerIndex = i - 6; 
        if (footerIndex >= 0 && footerIndex < footerCells.length) {
          totalRow[i] = footerCells[footerIndex];
        }
      }
      
      csv.push(totalRow.join(','));
    }

    csv.push(',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,');
    csv.push(',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,');
    csv.push('Job Sale Report,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,');
    csv.push(',,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,');
    
    const jobHeaders: string[] = [];
    Array.from(jobTable.rows[0].cells).forEach(cell => {
      jobHeaders.push(cell.textContent || '');
    });
    csv.push(jobHeaders.join(','));
    
    const jobRows = Array.from(jobTable.querySelectorAll<HTMLTableRowElement>('tbody tr'));
    
    jobRows.forEach(row => {
      const cols: string[] = Array.from(row.cells).map(td => {
        const inputElem = td.querySelector('input') as HTMLInputElement | null;
        return (inputElem ? inputElem.value : td.textContent || '');
      });
      csv.push(cols.join(','));
    });
    
    const jobFooter = jobTable.querySelector<HTMLTableRowElement>('tfoot tr');
    if (jobFooter) {
      const totalRow = Array(33).fill('');
      totalRow[6] = 'Total';
      
      const footerCells = Array.from(jobFooter.cells).map(td => td.textContent || '');
      
      for (let i = 7; i < jobHeaders.length; i++) {
        const footerIndex = i - 6; 
        if (footerIndex >= 0 && footerIndex < footerCells.length) {
          totalRow[i] = footerCells[footerIndex];
        }
      }
      
      csv.push(totalRow.join(','));
    }
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sales_report.csv';
    a.click();
  };

  useEffect(() => {
    calculate('counter');
    calculate('job');
  }, []);

  return (
    <div className="report-page">
      <div className="report-header">
        <div className="filters-toolbar">
          <div className="date-filters">
            <div className="filter-control">
              <label htmlFor="fromDate">From</label>
              <input 
                type="date" 
                id="fromDate" 
                className="control-input"
              />
            </div>
            <div className="filter-control">
              <label htmlFor="toDate">To</label>
              <input 
                type="date" 
                id="toDate" 
                className="control-input"
              />
            </div>
          </div>
          
          <div className="action-controls">
            <button onClick={applyFilters} className="btn btn-primary">
              <span className="btn-icon">🔍</span> Apply
            </button>
            <button onClick={exportAllToExcel} className="btn btn-secondary">
              <span className="btn-icon">⤓</span> Export All
            </button>
            <button onClick={() => window.print()} className="btn btn-secondary">
              <span className="btn-icon">🖨️</span> Print
            </button>
          </div>
        </div>
      </div>

      <div className="report-section">
        <div className="section-header">
          <h2>Counter Sale Report</h2>
          <button onClick={() => exportTableToCSV('counter')} className="btn btn-secondary">
            <span className="btn-icon">⤓</span> Export
          </button>
        </div>
        
        <div className="table-wrapper">
          <div className="table-scroll">
            <table id="counter_invoiceTable">
              <thead>
                <tr>
                  <th className="sticky-col">Sr.No</th>
                  <th className="sticky-col">Date</th>
                  <th>Particulars Name</th>
                  <th>Voucher Type</th>
                  <th>State</th>
                  <th>Invoice No</th>
                  <th>GSTIN/UID</th>
                  <th>Total Sale</th>
                  <th>Total Taxable</th>
                  <th>Total CGST</th>
                  <th>Total SGST</th>
                  <th>Total IGST</th>
                  <th>Sale 0%</th>
                  <th>Sale 5%</th>
                  <th>Taxable 5%</th>
                  <th>CGST 2.5%</th>
                  <th>SGST 2.5%</th>
                  <th>IGST 5%</th>
                  <th>Sale 12%</th>
                  <th>Taxable 12%</th>
                  <th>CGST 6%</th>
                  <th>SGST 6%</th>
                  <th>IGST 12%</th>
                  <th>Sale 18%</th>
                  <th>Taxable 18%</th>
                  <th>CGST 9%</th>
                  <th>SGST 9%</th>
                  <th>IGST 18%</th>
                  <th>Sale 28%</th>
                  <th>Taxable 28%</th>
                  <th>CGST 14%</th>
                  <th>SGST 14%</th>
                  <th>IGST 28%</th>
                </tr>
              </thead>

              <tbody id="counter_tableBody"></tbody>

              <tfoot>
                <tr>
                  <th colSpan={7} className="sticky-col">Total</th>
                  <th id="counter_totalPrice">0.00</th>
                  <th id="counter_totalAmount">0.00</th>
                  <th id="counter_cgst_total">0.00</th>
                  <th id="counter_sgst_total">0.00</th>
                  <th id="counter_igst_total">0.00</th>
                  <th>0</th>
                  <th>0</th>
                  <th id="counter_taxable_5">0.00</th>
                  <th id="counter_cgst_5">0.00</th>
                  <th id="counter_sgst_5">0.00</th>
                  <th id="counter_igst_5">0.00</th>
                  <th>0</th>
                  <th id="counter_taxable_12">0.00</th>
                  <th id="counter_cgst_12">0.00</th>
                  <th id="counter_sgst_12">0.00</th>
                  <th id="counter_igst_12">0.00</th>
                  <th>0</th>
                  <th id="counter_taxable_18">0.00</th>
                  <th id="counter_cgst_18">0.00</th>
                  <th id="counter_sgst_18">0.00</th>
                  <th id="counter_igst_18">0.00</th>
                  <th>0</th>
                  <th id="counter_taxable_28">0.00</th>
                  <th id="counter_cgst_28">0.00</th>
                  <th id="counter_sgst_28">0.00</th>
                  <th id="counter_igst_28">0.00</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div className="report-section job-section">
        <div className="section-header">
          <h2>Job Sale Report</h2>
          <button onClick={() => exportTableToCSV('job')} className="btn btn-secondary">
            <span className="btn-icon">⤓</span> Export
          </button>
        </div>
        
        <div className="table-wrapper">
          <div className="table-scroll">
            <table id="job_invoiceTable">
              <thead>
                <tr>
                  <th className="sticky-col">Sr.No</th>
                  <th className="sticky-col">Date</th>
                  <th>Particulars Name</th>
                  <th>Voucher Type</th>
                  <th>State</th>
                  <th>Invoice No</th>
                  <th>GSTIN/UID</th>
                  <th>Total Sale</th>
                  <th>Total Taxable</th>
                  <th>Total CGST</th>
                  <th>Total SGST</th>
                  <th>Total IGST</th>
                  <th>Sale 0%</th>
                  <th>Sale 5%</th>
                  <th>Taxable 5%</th>
                  <th>CGST 2.5%</th>
                  <th>SGST 2.5%</th>
                  <th>IGST 5%</th>
                  <th>Sale 12%</th>
                  <th>Taxable 12%</th>
                  <th>CGST 6%</th>
                  <th>SGST 6%</th>
                  <th>IGST 12%</th>
                  <th>Sale 18%</th>
                  <th>Taxable 18%</th>
                  <th>CGST 9%</th>
                  <th>SGST 9%</th>
                  <th>IGST 18%</th>
                  <th>Sale 28%</th>
                  <th>Taxable 28%</th>
                  <th>CGST 14%</th>
                  <th>SGST 14%</th>
                  <th>IGST 28%</th>
                </tr>
              </thead>

              <tbody id="job_tableBody"></tbody>

              <tfoot>
                <tr>
                  <th colSpan={7} className="sticky-col">Total</th>
                  <th id="job_totalPrice">0.00</th>
                  <th id="job_totalAmount">0.00</th>
                  <th id="job_cgst_total">0.00</th>
                  <th id="job_sgst_total">0.00</th>
                  <th id="job_igst_total">0.00</th>
                  <th>0</th>
                  <th>0</th>
                  <th id="job_taxable_5">0.00</th>
                  <th id="job_cgst_5">0.00</th>
                  <th id="job_sgst_5">0.00</th>
                  <th id="job_igst_5">0.00</th>
                  <th>0</th>
                  <th id="job_taxable_12">0.00</th>
                  <th id="job_cgst_12">0.00</th>
                  <th id="job_sgst_12">0.00</th>
                  <th id="job_igst_12">0.00</th>
                  <th>0</th>
                  <th id="job_taxable_18">0.00</th>
                  <th id="job_cgst_18">0.00</th>
                  <th id="job_sgst_18">0.00</th>
                  <th id="job_igst_18">0.00</th>
                  <th>0</th>
                  <th id="job_taxable_28">0.00</th>
                  <th id="job_cgst_28">0.00</th>
                  <th id="job_sgst_28">0.00</th>
                  <th id="job_igst_28">0.00</th>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        /* Modern Enterprise Styling */
        .report-page {
          padding: 0;
          background: #fff;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
          max-width: 100%;
          overflow: hidden;
        }

        .report-header {
          background: #f8f9fa;
          padding: 16px 20px;
          border-bottom: 1px solid #e9ecef;
        }

        .filters-toolbar {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .date-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          flex: 1;
          min-width: 320px;
        }
        
        .filter-control {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 140px;
        }

        .filter-control label {
          font-size: 12px;
          font-weight: 500;
          color: #495057;
          margin-bottom: 2px;
        }

        .control-input {
          height: 32px;
          padding: 0 8px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-size: 14px;
          width: 100%;
          background: white;
        }

        .action-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }

        .btn {
          height: 32px;
          padding: 0 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          white-space: nowrap;
        }

        .btn-primary {
          background-color: #0d6efd;
          color: white;
        }

        .btn-primary:hover {
          background-color: #0b5ed7;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background-color: #5c636a;
        }

        .btn-icon {
          margin-right: 6px;
          font-size: 14px;
        }
        
        .report-section {
          margin-bottom: 30px;
        }
        
        .job-section {
          margin-top: 40px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px;
          margin-bottom: 16px;
        }
        
        .section-header h2 {
          margin: 0;
          font-size: 18px;
          color: #212529;
          font-weight: bold;
        }

        /* Table Styling */
        .table-wrapper {
          position: relative;
          margin: 0;
          border-bottom: 1px solid #e9ecef;
          overflow: hidden;
        }

        .table-scroll {
          overflow-x: auto;
          max-width: 100%;
          margin-bottom: 0;
          scrollbar-width: thin;
          scrollbar-color: #888 #f1f1f1;
        }

        /* Webkit scrollbar customization */
        .table-scroll::-webkit-scrollbar {
          height: 8px;
        }

        .table-scroll::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .table-scroll::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }

        .table-scroll::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        table {
          width: max-content;
          min-width: 100%;
          border-collapse: collapse;
          white-space: nowrap;
          table-layout: auto;
        }

        thead {
          position: sticky;
          top: 0;
          z-index: 10;
        }

        th, td {
          border: 1px solid #dee2e6;
          padding: 8px;
          text-align: center;
          min-width: 100px;
          overflow: visible;
        }

        th {
          background: #343a40;
          color: white;
          font-weight: 500;
          font-size: 13px;
        }

        .sticky-col {
          position: sticky;
          left: 0;
          z-index: 5;
        }

        /* First column is sticky */
        th:first-child, td:first-child {
          position: sticky;
          left: 0;
          z-index: 5;
          background: #343a40;
        }

        /* Second column is sticky and positioned after the first column */
        th:nth-child(2), td:nth-child(2) {
          position: sticky;
          left: 60px; /* Width of the first column */
          z-index: 5;
          background: #343a40;
        }

        td:first-child, td:nth-child(2) {
          background: #fff;
        }

        thead th.sticky-col {
          background: #343a40;
          z-index: 11;
        }

        td {
          background: #fff;
          font-size: 13px;
        }

        tbody td {
          white-space: nowrap;
          overflow: visible;
        }

        input, select {
          width: 100%;
          padding: 4px;
          box-sizing: border-box;
          border: none;
          background: transparent;
          text-align: center;
          font-size: 13px;
          white-space: nowrap;
          overflow: visible;
        }

        input:read-only {
          color: #212529;
        }

        /* First columns wider for better visibility */
        th:nth-child(1), td:nth-child(1) {
          min-width: 60px;
        }

        th:nth-child(2), td:nth-child(2) {
          min-width: 100px;
        }

        th:nth-child(3), td:nth-child(3) {
          min-width: 150px;
        }

        /* Price columns */
        th:nth-child(8), td:nth-child(8),
        th:nth-child(9), td:nth-child(9) {
          min-width: 100px;
        }

        tfoot {
          position: sticky;
          bottom: 0;
          z-index: 2;
        }
        
        tfoot tr {
          background: #343a40;
        }
        
        tfoot th, tfoot td {
          background: #343a40;
          color: white;
          position: relative;
          font-weight: 500;
          white-space: nowrap;
          overflow: visible;
          min-width: 100px;
        }
        
        /* Make the first cells in the footer sticky */
        tfoot th:first-child {
          position: sticky;
          left: 0;
          z-index: 6;
        }
        
        /* Ensure footer colspan cell is sticky */
        tfoot th.sticky-col {
          text-align: center;
          font-weight: 500;
          position: sticky;
          left: 0;
          z-index: 6;
        }

        @media print {
          .filters-toolbar, .section-header button {
            display: none;
          }
          
          .report-section {
            page-break-before: always;
          }
          
          .table-scroll {
            overflow: visible;
          }
          
          table {
            width: 100%;
          }
        }

        @media screen and (max-width: 768px) {
          .filters-toolbar {
            flex-direction: column;
          }
          
          .date-filters, .action-controls {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default ReportForm;