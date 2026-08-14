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
  customerId: z.string({
    invalid_type_error: 'Please select a customer.'
  }),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than 0.'}),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.'
  }),
  date: z.string()
})

const InvoiceValidation = FormSchema.omit({ id: true, date: true })

const redirectAndRevalidateInvoices = () => {
  revalidatePath(invoicesURL)
  redirect(invoicesURL)
}

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  }
  message?: string | null;
}

export const createInvoice = async (_: State, formData: FormData): Promise<State> => {
  const rawData = extractFormData(formData)

  try {
    const validatedFields = InvoiceValidation.safeParse(rawData)

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing fields. Failed to create invoice.'
      }
    }

    const { customerId, amount, status } = validatedFields.data

    const amountInCents = amount * 100
    const date = new Date().toISOString().split('T')[0]

    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `
  } catch (err) {
    console.error(err)
    return {
      message: 'Database error: Failed to create invoice.'
    }
  }

  redirectAndRevalidateInvoices()

  return {}
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
  }

  redirectAndRevalidateInvoices()
}

export const deleteInvoice = async (id: string) => {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`
  } catch (err) {
    console.error(err)
  }

  revalidatePath(invoicesURL)
}