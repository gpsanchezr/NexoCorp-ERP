"use client";

import { useState } from "react";
import { Download, Loader2, Mail, MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogoMark } from "@/components/shared/logo";
import { getSector } from "@/lib/config";
import { buildMailtoLink, buildWhatsAppLink, formatCOP, formatDateTime } from "@/lib/utils";
import type { Business, Sale } from "@/lib/types";

export function ReceiptView({
  sale,
  business,
  onNewSale,
}: {
  sale: Sale;
  business: Business;
  onNewSale?: () => void;
}) {
  const [generating, setGenerating] = useState(false);
  const sector = getSector(business.sector);

  async function handleDownloadPdf() {
    setGenerating(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { ReceiptDocument } = await import("@/lib/pdf/receipt-document");
      const blob = await pdf(<ReceiptDocument sale={sale} business={business} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recibo-${sale.receiptNumber}-${business.slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } finally {
      setGenerating(false);
    }
  }

  const whatsappMessage = `Hola${sale.customer?.name ? ` ${sale.customer.name.split(" ")[0]}` : ""}, te comparto tu recibo de ${business.name}.\nRecibo No. ${sale.receiptNumber}\nTotal: ${formatCOP(sale.totalAmount)}\n¡Gracias por tu compra!`;
  const whatsappHref = buildWhatsAppLink(sale.customer?.phone || business.whatsappNumber, whatsappMessage);
  const mailHref = sale.customer?.email
    ? buildMailtoLink(
        sale.customer.email,
        `Recibo de compra ${sale.receiptNumber} — ${business.name}`,
        `${whatsappMessage}\n\n(Adjunta el PDF descargado desde NexoCorp antes de enviar este correo.)`
      )
    : undefined;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex items-start justify-between border-b border-ink-100 p-5">
          <div className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <div>
              <p className="text-sm font-bold text-ink-900">{business.name}</p>
              <p className="text-xs text-ink-400">
                {sector.label} · {business.city}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-ink-900">No. {sale.receiptNumber}</p>
            <p className="text-xs text-ink-400">{formatDateTime(sale.createdAt)}</p>
          </div>
        </div>

        {sale.customer && (
          <div className="border-b border-ink-100 px-5 py-3 text-sm text-ink-600">
            <p className="font-semibold text-ink-800">{sale.customer.name}</p>
            <p className="text-xs text-ink-400">
              {[sale.customer.cedulaNit, sale.customer.phone, sale.customer.email].filter(Boolean).join(" · ")}
            </p>
          </div>
        )}

        <div className="p-5">
          <div className="space-y-2.5">
            {sale.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-ink-800">{item.productName}</p>
                  <p className="text-xs text-ink-400">
                    {item.quantity} × {formatCOP(item.unitPrice)}
                  </p>
                </div>
                <p className="font-semibold text-ink-800">{formatCOP(item.subtotal)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1.5 border-t border-dashed border-ink-200 pt-4">
            <div className="flex justify-between text-sm text-ink-500">
              <span>Subtotal</span>
              <span>{formatCOP(sale.subtotal)}</span>
            </div>
            {sale.discountType !== "none" && (
              <div className="flex justify-between text-sm text-ink-500">
                <span>Descuento{sale.discountType === "percent" ? ` (${sale.discountValue}%)` : ""}</span>
                <span>-{formatCOP(sale.subtotal - sale.totalAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-ink-100 pt-1.5 text-base font-bold text-ink-900">
              <span>Total</span>
              <span>{formatCOP(sale.totalAmount)}</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <Button variant="outline" onClick={handleDownloadPdf} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Descargar PDF
        </Button>
        <Button asChild variant="success">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </Button>
        {mailHref ? (
          <Button asChild variant="secondary">
            <a href={mailHref}>
              <Mail className="h-4 w-4" />
              Correo
            </a>
          </Button>
        ) : (
          <Button variant="secondary" disabled title="El cliente no tiene correo registrado">
            <Mail className="h-4 w-4" />
            Correo
          </Button>
        )}
      </div>

      {onNewSale && (
        <Button variant="ghost" className="w-full" onClick={onNewSale}>
          <Plus className="h-4 w-4" />
          Nueva venta
        </Button>
      )}
    </div>
  );
}
