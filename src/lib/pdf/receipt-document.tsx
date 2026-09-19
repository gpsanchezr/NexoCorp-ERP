import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Business, Sale } from "@/lib/types";
import { formatCOP, formatDateTime } from "@/lib/utils";
import { getSector } from "@/lib/config";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: "#12141b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: "#1d4fed",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: "#1d4fed",
  },
  brandName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#12141b" },
  brandTagline: { fontSize: 8, color: "#7c8598", marginTop: 1 },
  metaBlock: { alignItems: "flex-end" },
  metaTitle: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  metaLine: { fontSize: 8.5, color: "#5c6577", marginTop: 2 },
  section: { marginBottom: 12 },
  sectionLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#7c8598",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  customerLine: { fontSize: 9.5, color: "#20242e", marginBottom: 1.5 },
  table: { borderTopWidth: 1, borderTopColor: "#e9ebef" },
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f6f8",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eceef2",
  },
  colProduct: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 1.4, textAlign: "right" },
  colSubtotal: { flex: 1.4, textAlign: "right" },
  thText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#5c6577" },
  totalsBlock: { marginTop: 10, alignSelf: "flex-end", width: "55%" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
  totalsLabel: { fontSize: 9.5, color: "#5c6577" },
  totalsValue: { fontSize: 9.5, color: "#20242e" },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#12141b",
  },
  grandTotalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  grandTotalValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  footer: { marginTop: 34 },
  signatureLine: {
    width: 180,
    borderTopWidth: 1,
    borderTopColor: "#a8afbd",
    paddingTop: 4,
    marginTop: 30,
  },
  signatureCaption: { fontSize: 8, color: "#7c8598" },
  thanksText: { fontSize: 9, color: "#5c6577", marginTop: 24, textAlign: "center" },
  legalText: { fontSize: 7, color: "#a8afbd", marginTop: 4, textAlign: "center" },
});

export function ReceiptDocument({ sale, business }: { sale: Sale; business: Business }) {
  const sector = getSector(business.sector);

  return (
    <Document title={`Recibo ${sale.receiptNumber} - ${business.name}`}>
      <Page size="A5" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox} />
            <View>
              <Text style={styles.brandName}>{business.name}</Text>
              <Text style={styles.brandTagline}>
                {sector.label} · {business.city}
              </Text>
            </View>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaTitle}>Factura de Venta Electrónica</Text>
            <Text style={styles.metaLine}>No. Recibo {sale.receiptNumber}</Text>
            <Text style={styles.metaLine}>{formatDateTime(sale.createdAt)}</Text>
          </View>
        </View>

        {sale.customer && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Cliente</Text>
            <Text style={styles.customerLine}>{sale.customer.name}</Text>
            {sale.customer.cedulaNit && (
              <Text style={styles.customerLine}>C.C./NIT: {sale.customer.cedulaNit}</Text>
            )}
            {sale.customer.phone && <Text style={styles.customerLine}>Tel: {sale.customer.phone}</Text>}
            {sale.customer.email && <Text style={styles.customerLine}>{sale.customer.email}</Text>}
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.thText, styles.colProduct]}>Producto</Text>
            <Text style={[styles.thText, styles.colQty]}>Cant.</Text>
            <Text style={[styles.thText, styles.colPrice]}>Precio Unit.</Text>
            <Text style={[styles.thText, styles.colSubtotal]}>Subtotal</Text>
          </View>
          {sale.items.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={styles.colProduct}>{item.productName}</Text>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colPrice}>{formatCOP(item.unitPrice)}</Text>
              <Text style={styles.colSubtotal}>{formatCOP(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatCOP(sale.subtotal)}</Text>
          </View>
          {sale.discountType !== "none" && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Descuento {sale.discountType === "percent" ? `(${sale.discountValue}%)` : ""}
              </Text>
              <Text style={styles.totalsValue}>-{formatCOP(sale.subtotal - sale.totalAmount)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCOP(sale.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureCaption}>Firma autorizada — {business.name}</Text>
          </View>
          <Text style={styles.thanksText}>Gracias por su compra en {business.name}</Text>
          <Text style={styles.legalText}>
            Generado con {business.name} · Documento equivalente a factura de venta, generado por sistema POS.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
