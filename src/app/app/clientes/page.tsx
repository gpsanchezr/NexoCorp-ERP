"use client";

import { useMemo, useState } from "react";
import { Mail, MessageCircle, Phone, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buildWhatsAppLink, formatCOP } from "@/lib/utils";
import { useDataStore } from "@/store/useDataStore";

export default function ClientesPage() {
  const customers = useDataStore((s) => s.customers);
  const fiados = useDataStore((s) => s.fiados);
  const sales = useDataStore((s) => s.sales);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return customers;
    const q = query.trim().toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.cedulaNit?.includes(q));
  }, [customers, query]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Clientes</h1>
          <p className="text-sm text-ink-500">{customers.length} clientes registrados</p>
        </div>
        <div className="relative w-52">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <Input className="h-9 pl-8 text-sm" placeholder="Buscar…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((customer) => {
          const debt = fiados.filter((f) => f.customerId === customer.id && f.status !== "pagado").reduce((a, f) => a + f.totalDebt, 0);
          const purchaseCount = sales.filter((s) => s.customerId === customer.id).length;
          return (
            <Card key={customer.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-ink-900">{customer.name}</p>
                  <p className="text-xs text-ink-400">{customer.cedulaNit}</p>
                </div>
                {debt > 0 && <Badge variant="warning">Debe {formatCOP(debt)}</Badge>}
              </div>
              <p className="mt-2 text-xs text-ink-400">{purchaseCount} compra(s) registradas</p>
              <div className="mt-3 flex gap-2">
                {customer.phone && (
                  <Button asChild size="sm" variant="success">
                    <a href={buildWhatsAppLink(customer.phone, `Hola ${customer.name.split(" ")[0]}, te saluda tu farmacia de confianza.`)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                  </Button>
                )}
                {customer.email && (
                  <Button asChild size="sm" variant="outline">
                    <a href={`mailto:${customer.email}`}>
                      <Mail className="h-3.5 w-3.5" />
                      Correo
                    </a>
                  </Button>
                )}
                {customer.phone && (
                  <Button asChild size="sm" variant="ghost">
                    <a href={`tel:+${customer.phone}`}>
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <CardContent className="col-span-2 py-10 text-center text-sm text-ink-400">Sin resultados.</CardContent>
        )}
      </div>
    </div>
  );
}
