import { use } from 'react';
import { Metadata, NextPage } from 'next';
import { notFound } from 'next/navigation';

import EditForm from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers, fetchInvoiceById } from '@/app/lib/data';
 
export const metadata: Metadata = {
  title: 'Edit Invoice',
}

interface PageProps { 
  params: Promise<{ id: string }>
}

const Page: NextPage<PageProps> = ({ params }) => {
  const { id } = use(params)
  const [invoice, customers] = use(Promise.all([
    fetchInvoiceById(id),
    fetchCustomers()
  ]))

  if (!invoice) notFound()

  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <EditForm invoice={invoice} customers={customers} />
    </main>
  );
}

export default Page