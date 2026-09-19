"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, MessageCircle, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildWhatsAppLink, formatCOP, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";
import type { FiadoStatus } from "@/lib/types";

const STATUS_VARIANT: Record<FiadoStatus, "success" | "warning" | "danger"> = {
  pagado: "success",
  pendiente: "warning",
  vencido: "danger",
};
const STATUS_LABEL: Record<FiadoStatus, string> = {
  pagado: "Pagado",
  pendiente: "Pendiente",
  vencido: "Vencido",
};

export default function FiadosPage() {
  const business = useAuthStore((s) => s.business);
  const fiados = useDataStore((s) => s.fiados);
  const markFiadoPaid = useDataStore((s) => s.markFiadoPaid);
  const addFiado = useDataStore((s) => s.addFiado);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");

  const pending = fiados.filter((f) => f.status !== "pagado");
  const paid = fiados.filter((f) => f.status === "pagado");
  const totalPending = pending.reduce((acc, f) => acc + f.totalDebt, 0);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    addFiado({
      customerName: name,
      customerPhone: phone || undefined,
      totalDebt: Number(amount),
      dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
    });
    setName("");
    setPhone("");
    setAmount("");
    setDueDate("");
    setShowForm(false);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link href="/app/mobile" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 md:hidden">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ink-900">Fiados</h1>
            <p className="text-xs text-ink-400">Cuaderno digital de deudas por cobrar</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          Nueva deuda
        </Button>
      </div>

      {showForm && (
        <Card className="mb-5 p-4">
          <form onSubmit={handleAdd} className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="f-name">Cliente</Label>
              <Input id="f-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-phone">WhatsApp</Label>
              <Input id="f-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="573001234567" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-amount">Monto</Label>
              <Input id="f-amount" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-due">Fecha límite</Label>
              <Input id="f-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <Button type="submit" className="sm:col-span-2">
              Guardar deuda
            </Button>
          </form>
        </Card>
      )}

      <Card className="mb-5 border-warning-100 bg-warning-50 p-4">
        <p className="text-xs font-medium text-warning-600">Total pendiente por cobrar</p>
        <p className="text-2xl font-bold text-warning-700">{formatCOP(totalPending)}</p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deudas activas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 && <p className="text-sm text-ink-400">No hay deudas pendientes. 🎉</p>}
          {pending.map((fiado) => {
            const message = `Hola ${fiado.customerName.split(" ")[0]}, te saluda ${business.name}. Te recordamos tu saldo pendiente de ${formatCOP(fiado.totalDebt)} con fecha límite ${formatDate(fiado.dueDate)}. ¡Gracias!`;
            return (
              <div key={fiado.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink-800">{fiado.customerName}</p>
                  <p className="text-xs text-ink-400">Vence {formatDate(fiado.dueDate)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink-900">{formatCOP(fiado.totalDebt)}</p>
                    <Badge variant={STATUS_VARIANT[fiado.status]} className="mt-0.5">
                      {STATUS_LABEL[fiado.status]}
                    </Badge>
                  </div>
                  {fiado.customerPhone && (
                    <Button asChild size="icon" variant="success" title="Enviar recordatorio por WhatsApp">
                      <a href={buildWhatsAppLink(fiado.customerPhone, message)} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => markFiadoPaid(fiado.id)}>
                    Pagado
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {paid.length > 0 && (
        <Card className="mt-5 opacity-70">
          <CardHeader>
            <CardTitle>Pagadas recientemente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {paid.map((fiado) => (
              <div key={fiado.id} className="flex items-center justify-between text-sm">
                <span className="text-ink-600">{fiado.customerName}</span>
                <span className="font-medium text-ink-500">{formatCOP(fiado.totalDebt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
