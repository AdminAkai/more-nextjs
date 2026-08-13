'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import postgres from 'postgres'
import { extractFormData } from './utils'

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' })

const invoicesURL = '/dashboard/invoices'

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string()
})

const InvoiceValidation = FormSchema.omit({ id: true, date: true })

const redirectAndRevalidateInvoices = () => {
  revalidatePath(invoicesURL)
  redirect(invoicesURL)
}

export const createInvoice = async (formData: FormData) => {
  const rawData = extractFormData(formData)

  try {
    const { customerId, amount, status } = InvoiceValidation.parse(rawData)

    const amountInCents = amount * 100
    const date = new Date().toISOString().split('T')[0]

    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `
  } catch (err) {
    console.error(err)
  } finally {
    redirectAndRevalidateInvoices()
  }
}

export const updateInvoice = async (id: string, formData: FormData) => {
  const rawData = extractFormData(formData)

  try {
    const { customerId, amount, status } = InvoiceValidation.parse(rawData)

    const amountInCents = amount * 100

    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `
  } catch (err) {
    console.error(err)
  } finally {
    redirectAndRevalidateInvoices()
  }
}

export const deleteInvoice = async (id: string) => {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`
  } catch (err) {
    console.error(err)
  } finally {
    revalidatePath(invoicesURL)
  }
}