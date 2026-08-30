import type { ReactNode } from "react";
import { Field } from "@/components/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function PartyFields<
  T extends {
    name: string;
    contact: string;
    email: string;
    phone: string;
    address: string;
    terms: string;
    notes: string;
  },
>({
  form,
  setForm,
  extra,
}: {
  form: T;
  setForm: (next: T) => void;
  extra?: ReactNode;
}) {
  return (
    <div className="grid gap-4">
      <Field label="Company / name">
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Contact">
        <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
      </div>
      <Field label="Address">
        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </Field>
      <Field label="Terms">
        <Input value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
      </Field>
      {extra}
      <Field label="Notes">
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </Field>
    </div>
  );
}
