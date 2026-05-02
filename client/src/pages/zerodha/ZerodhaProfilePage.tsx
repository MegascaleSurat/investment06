import { useZerodhaProfile } from '@/hooks/useZerodhaProfile';
import { 
  User, 
  Mail, 
  CreditCard, 
  ShieldCheck, 
  Building, 
  Globe, 
  Briefcase, 
  Zap,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function ZerodhaProfilePage() {
  const { data, isLoading, error } = useZerodhaProfile();

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[300px] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Error Loading Profile</AlertTitle>
          <AlertDescription>
            { (error as any)?.response?.data?.message || 'Unable to fetch your Zerodha profile. Please check your connection.' }
          </AlertDescription>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  // Get initials for avatar fallback
  const initials = data.user_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b">
        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20 border-2 border-primary/10">
            <AvatarImage src={data.avatar_url} alt={data.user_name} />
            <AvatarFallback className="text-xl bg-primary/5 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{data.user_name}</h1>
            <div className="flex items-center gap-2 mt-1">
               <Badge variant="secondary" className="font-mono">{data.user_id}</Badge>
               <span className="text-muted-foreground text-sm">•</span>
               <span className="text-muted-foreground text-sm capitalize">{data.user_type.replace('/', ' • ')}</span>
            </div>
          </div>
        </div>
        <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10 border-green-500/20 px-4 py-1 text-sm font-semibold flex gap-2">
          <ShieldCheck className="h-4 w-4" />
          Verified Broker: {data.broker}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact & Identity Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-none bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Identity Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Short Name</p>
                <p className="font-medium">{data.user_shortname}</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Email Address</p>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <p className="font-medium">{data.email}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Demat Consent</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="uppercase">{data.meta.demat_consent || 'N/A'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground border-none">
            <CardHeader>
              <CardTitle className="text-lg">Trading Account</CardTitle>
              <CardDescription className="text-primary-foreground/70">Connected via Kite Connect API v3</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-sm">Your account is fully synchronized. Real-time data and automated execution are active.</p>
            </CardContent>
          </Card>
        </div>

        {/* Capabilities Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Account Capabilities
              </CardTitle>
              <CardDescription>Available exchanges and products supported by your broker</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Exchanges */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Globe className="h-4 w-4 text-blue-500" />
                  Allowed Exchanges
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.exchanges.map((ex: string) => (
                    <Badge key={ex} variant="secondary" className="rounded-md px-3">{ex}</Badge>
                  ))}
                </div>
              </div>

              {/* Products */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Zap className="h-4 w-4 text-orange-500" />
                  Product Types
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.products.map((prod: string) => (
                    <Badge key={prod} variant="outline" className="rounded-md px-3 border-orange-200 text-orange-700 bg-orange-50/50">{prod}</Badge>
                  ))}
                </div>
              </div>

              {/* Order Types */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CreditCard className="h-4 w-4 text-green-500" />
                  Order Varieties
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.order_types.map((type: string) => (
                    <Badge key={type} variant="secondary" className="rounded-md px-3 font-mono">{type}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground border-t bg-muted/10 py-3">
              Data synchronized from Zerodha backend
            </CardFooter>
          </Card>

          {/* Quick Actions Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors">Market Watch</CardTitle>
                  <CardDescription className="text-xs">View your saved stock watchlists</CardDescription>
                </CardHeader>
             </Card>
             <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardHeader className="p-4">
                  <CardTitle className="text-sm font-bold group-hover:text-primary transition-colors">Portfolio Status</CardTitle>
                  <CardDescription className="text-xs">Check current holdings and margins</CardDescription>
                </CardHeader>
             </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
