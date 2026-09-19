"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MOCK_BUSINESS,
  MOCK_CUSTOMERS,
  MOCK_FIADOS,
  MOCK_OPERATING_EXPENSES,
  MOCK_PRODUCTS,
  MOCK_SALES,
  nextReceiptSequence,
} from "@/lib/mock-data";
import type {
  Customer,
  CustomerSnapshot,
  DiscountType,
  FiadoRecord,
  IncompatibilityCheck,
  OperatingExpense,
  Product,
  Purchase,
  PurchaseItem,
  Sale,
} from "@/lib/types";
import { calcSaleTotals, checkCrossContamination, generateReceiptNumber, suggestSalePrice, uid } from "@/lib/utils";

interface DataState {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  purchases: Purchase[];
  fiados: FiadoRecord[];
  operatingExpenses: OperatingExpense[];
  uvtAccumulated: number;
  liveSalesTotal: number;
  livePurchasesTotal: number;
  lastReceiptSeq: number;
  isOnline: boolean;
  pendingSyncIds: string[];

  setOnline: (online: boolean) => void;

  registerSale: (input: {
    items: { product: Product; quantity: number }[];
    discountType: DiscountType;
    discountValue: number;
    customer?: CustomerSnapshot;
  }) => Sale;

  addProduct: (
    input: Omit<Product, "id" | "businessId">
  ) => { ok: true; product: Product } | ({ ok: false } & IncompatibilityCheck);

  updateProduct: (productId: string, patch: Partial<Product>) => void;

  confirmScannedPurchase: (input: {
    supplierName: string;
    items: PurchaseItem[];
  }) => Purchase;

  addExpense: (input: { type: string; description: string; amount: number }) => void;

  markFiadoPaid: (id: string) => void;
  sendFiadoReminderNote: (id: string) => void;
  addFiado: (input: { customerName: string; customerPhone?: string; totalDebt: number; dueDate: string }) => void;

  resetDemoData: () => void;
}

function freshCustomers() {
  return MOCK_CUSTOMERS.map((c) => ({ ...c }));
}

function findOrCreateCustomer(customers: Customer[], snapshot?: CustomerSnapshot) {
  if (!snapshot || !snapshot.name?.trim()) return { customers, customer: undefined as Customer | undefined };
  const existing = customers.find(
    (c) =>
      (snapshot.cedulaNit && c.cedulaNit === snapshot.cedulaNit) ||
      (snapshot.phone && c.phone === snapshot.phone)
  );
  if (existing) return { customers, customer: existing };
  const created: Customer = {
    id: uid("cus"),
    businessId: MOCK_BUSINESS.id,
    name: snapshot.name,
    cedulaNit: snapshot.cedulaNit,
    phone: snapshot.phone,
    email: snapshot.email,
  };
  return { customers: [...customers, created], customer: created };
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      products: MOCK_PRODUCTS.map((p) => ({ ...p })),
      customers: freshCustomers(),
      sales: MOCK_SALES.map((s) => ({ ...s })),
      purchases: [],
      fiados: MOCK_FIADOS.map((f) => ({ ...f })),
      operatingExpenses: MOCK_OPERATING_EXPENSES.map((e) => ({ ...e })),
      uvtAccumulated: MOCK_BUSINESS.currentUvtTotal,
      liveSalesTotal: 0,
      livePurchasesTotal: 0,
      lastReceiptSeq: nextReceiptSequence,
      isOnline: true,
      pendingSyncIds: [],

      setOnline: (online) => {
        set({ isOnline: online });
        if (online) {
          // "Sincroniza" las ventas que se hicieron sin conexión.
          set({ pendingSyncIds: [] });
        }
      },

      registerSale: ({ items, discountType, discountValue, customer }) => {
        const state = get();
        const { customers, customer: resolvedCustomer } = findOrCreateCustomer(state.customers, customer);

        const saleId = uid("sale");
        const saleItems = items.map((l) => ({
          id: uid("item"),
          saleId,
          productId: l.product.id,
          productName: l.product.name,
          quantity: l.quantity,
          unitPrice: l.product.salePrice,
          subtotal: l.quantity * l.product.salePrice,
        }));
        const { subtotal, total } = calcSaleTotals(saleItems, discountType, discountValue);
        const nextSeq = state.lastReceiptSeq + 1;

        const sale: Sale = {
          id: saleId,
          businessId: MOCK_BUSINESS.id,
          receiptNumber: generateReceiptNumber(nextSeq),
          customerId: resolvedCustomer?.id,
          customer: resolvedCustomer
            ? {
                name: resolvedCustomer.name,
                cedulaNit: resolvedCustomer.cedulaNit,
                phone: resolvedCustomer.phone,
                email: resolvedCustomer.email,
              }
            : undefined,
          items: saleItems,
          discountType,
          discountValue,
          subtotal,
          totalAmount: total,
          createdAt: new Date().toISOString(),
          createdOffline: !state.isOnline,
        };

        const updatedProducts = state.products.map((p) => {
          const line = items.find((l) => l.product.id === p.id);
          if (!line) return p;
          return { ...p, stockQuantity: Math.max(0, p.stockQuantity - line.quantity) };
        });

        set({
          products: updatedProducts,
          customers,
          sales: [sale, ...state.sales],
          lastReceiptSeq: nextSeq,
          liveSalesTotal: state.liveSalesTotal + total,
          uvtAccumulated: state.uvtAccumulated + total,
          pendingSyncIds: state.isOnline ? state.pendingSyncIds : [...state.pendingSyncIds, saleId],
        });

        return sale;
      },

      addProduct: (input) => {
        const state = get();
        const check = checkCrossContamination(
          { name: input.name, safetyFlags: input.safetyFlags },
          state.products
        );
        if (check.blocked) return { ok: false, ...check };

        const product: Product = { ...input, id: uid("prod"), businessId: MOCK_BUSINESS.id };
        set({ products: [product, ...state.products] });
        return { ok: true, product };
      },

      updateProduct: (productId, patch) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === productId ? { ...p, ...patch } : p)),
        }));
      },

      confirmScannedPurchase: ({ supplierName, items }) => {
        const state = get();
        const sector = MOCK_BUSINESS.sector;
        let products = state.products;

        for (const item of items) {
          const existing = item.productId
            ? products.find((p) => p.id === item.productId)
            : products.find((p) => p.name.toLowerCase() === item.productName.toLowerCase());

          if (existing) {
            products = products.map((p) =>
              p.id === existing.id
                ? {
                    ...p,
                    stockQuantity: p.stockQuantity + item.quantity,
                    costPrice: item.unitCost,
                    expirationDate: item.expirationDate ?? p.expirationDate,
                  }
                : p
            );
          } else {
            products = [
              {
                id: uid("prod"),
                businessId: MOCK_BUSINESS.id,
                name: item.productName,
                category: "Sin categoría",
                costPrice: item.unitCost,
                salePrice: suggestSalePrice(item.unitCost, sector),
                stockQuantity: item.quantity,
                minStock: Math.max(5, Math.round(item.quantity * 0.2)),
                expirationDate: item.expirationDate,
                safetyFlags: [],
              },
              ...products,
            ];
          }
        }

        const totalAmount = items.reduce((acc, it) => acc + it.quantity * it.unitCost, 0);
        const purchase: Purchase = {
          id: uid("purch"),
          businessId: MOCK_BUSINESS.id,
          supplierName,
          totalAmount,
          items,
          createdAt: new Date().toISOString(),
        };

        set({
          products,
          purchases: [purchase, ...state.purchases],
          livePurchasesTotal: state.livePurchasesTotal + totalAmount,
        });

        return purchase;
      },

      addExpense: ({ type, description, amount }) => {
        set((state) => ({
          operatingExpenses: [
            {
              id: uid("exp"),
              businessId: MOCK_BUSINESS.id,
              type,
              description,
              amount,
              createdAt: new Date().toISOString(),
            },
            ...state.operatingExpenses,
          ],
        }));
      },

      markFiadoPaid: (id) => {
        set((state) => ({
          fiados: state.fiados.map((f) => (f.id === id ? { ...f, status: "pagado" } : f)),
        }));
      },

      sendFiadoReminderNote: () => {
        // No-op de estado: el envío real ocurre al abrir el enlace wa.me — ver
        // components/mobile/fiados-list.tsx. Queda el hook por si se quiere
        // registrar auditoría de recordatorios enviados en el futuro.
      },

      addFiado: ({ customerName, customerPhone, totalDebt, dueDate }) => {
        set((state) => ({
          fiados: [
            {
              id: uid("fiado"),
              businessId: MOCK_BUSINESS.id,
              customerId: uid("cus"),
              customerName,
              customerPhone,
              totalDebt,
              dueDate,
              status: "pendiente",
            },
            ...state.fiados,
          ],
        }));
      },

      resetDemoData: () =>
        set({
          products: MOCK_PRODUCTS.map((p) => ({ ...p })),
          customers: freshCustomers(),
          sales: MOCK_SALES.map((s) => ({ ...s })),
          purchases: [],
          fiados: MOCK_FIADOS.map((f) => ({ ...f })),
          operatingExpenses: MOCK_OPERATING_EXPENSES.map((e) => ({ ...e })),
          uvtAccumulated: MOCK_BUSINESS.currentUvtTotal,
          liveSalesTotal: 0,
          livePurchasesTotal: 0,
          lastReceiptSeq: nextReceiptSequence,
          isOnline: true,
          pendingSyncIds: [],
        }),
    }),
    { name: "nexocorp-data", skipHydration: true }
  )
);
