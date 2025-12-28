import { useState } from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePaymentLinksData, PaymentLinkStatus } from '@/hooks/usePaymentLinksData';
import PaymentLinkForm from '@/components/payment-links/PaymentLinkForm';
import PaymentLinkList from '@/components/payment-links/PaymentLinkList';
import { Plus, Link as LinkIcon, Loader2, Search } from 'lucide-react';

const PaymentLinksPage = () => {
  const {
    paymentLinks,
    loading,
    partnerId,
    createPaymentLink,
    cancelPaymentLink,
    copyPaymentLink,
  } = usePaymentLinksData();

  const [formOpen, setFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentLinkStatus | 'all'>('all');

  // Filter payment links
  const filteredLinks = paymentLinks.filter((link) => {
    const matchesSearch =
      !searchQuery ||
      link.booking?.customer?.full_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      link.booking?.customer?.email
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      link.amount.toString().includes(searchQuery);

    const matchesStatus =
      statusFilter === 'all' || link.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Count by status
  const statusCounts = {
    all: paymentLinks.length,
    active: paymentLinks.filter((l) => l.status === 'active').length,
    paid: paymentLinks.filter((l) => l.status === 'paid').length,
    expired: paymentLinks.filter((l) => l.status === 'expired').length,
    cancelled: paymentLinks.filter((l) => l.status === 'cancelled').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Payment Links
            </h1>
            <p className="text-muted-foreground mt-1">
              Create and manage payment links for customers
            </p>
          </div>
          <Button variant="hero" onClick={() => setFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Link
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-primary">
                {statusCounts.active}
              </div>
              <p className="text-sm text-muted-foreground">Active Links</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {statusCounts.paid}
              </div>
              <p className="text-sm text-muted-foreground">Paid</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-muted-foreground">
                {statusCounts.expired}
              </div>
              <p className="text-sm text-muted-foreground">Expired</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-destructive">
                {statusCounts.cancelled}
              </div>
              <p className="text-sm text-muted-foreground">Cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Payment Links
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[200px]"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as PaymentLinkStatus | 'all')
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ({statusCounts.all})</SelectItem>
                    <SelectItem value="active">
                      Active ({statusCounts.active})
                    </SelectItem>
                    <SelectItem value="paid">Paid ({statusCounts.paid})</SelectItem>
                    <SelectItem value="expired">
                      Expired ({statusCounts.expired})
                    </SelectItem>
                    <SelectItem value="cancelled">
                      Cancelled ({statusCounts.cancelled})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <PaymentLinkList
                paymentLinks={filteredLinks}
                onCopy={copyPaymentLink}
                onCancel={cancelPaymentLink}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Payment Link Form */}
      <PaymentLinkForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={createPaymentLink}
        partnerId={partnerId}
      />
    </DashboardLayout>
  );
};

export default PaymentLinksPage;
