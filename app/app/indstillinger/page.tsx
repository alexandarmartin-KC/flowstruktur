'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePlan } from '@/contexts/plan-context';
import { Sparkles, Crown } from 'lucide-react';

export default function IndstillingerPage() {
  const { plan, setPlan, isProUser } = usePlan();

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">Indstillinger</h1>
        <p className="text-muted-foreground">
          Administrer din profil og præferencer
        </p>
      </div>

      {/* Plan section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Din plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Aktiv plan</p>
              <p className="text-sm text-muted-foreground">
                {isProUser ? 'Pro plan - Fuld adgang til alle features' : 'Light plan - Begrænset adgang'}
              </p>
            </div>
            <Badge variant={isProUser ? 'default' : 'secondary'} className="text-base px-4 py-2">
              {isProUser ? 'PRO' : 'LIGHT'}
            </Badge>
          </div>

          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-4">
              <Label htmlFor="plan-toggle" className="text-base">
                Demo: Skift mellem Light og Pro
              </Label>
              <Switch
                id="plan-toggle"
                checked={isProUser}
                onCheckedChange={(checked) => setPlan(checked ? 'pro' : 'light')}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Dette er en demo-funktion. I produktion ville der være en betalingsintegration.
            </p>
          </div>

          {!isProUser && (
            <div className="border border-primary rounded-lg p-6 bg-primary/5">
              <div className="flex items-start gap-4">
                <Sparkles className="h-6 w-6 text-primary shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Opgrader til Pro</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Få adgang til flere karrierespor, op til 12 jobmatch, personlig action plan og AI-genererede ansøgninger.
                  </p>
                  <Button onClick={() => setPlan('pro')}>
                    Opgrader nu - 299 kr/måned
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile section */}
      <Card>
        <CardHeader>
          <CardTitle>Profil information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Navn</Label>
            <p className="text-sm text-muted-foreground">Demo Bruger</p>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">demo@flowstruktur.dk</p>
          </div>
          <div className="space-y-2">
            <Label>Medlem siden</Label>
            <p className="text-sm text-muted-foreground">December 2025</p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifikationer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Nye jobmatch</Label>
              <p className="text-sm text-muted-foreground">Få besked når der er nye relevante jobs</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Karrieretips</Label>
              <p className="text-sm text-muted-foreground">Ugentlige tips til din udvikling</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Produkt opdateringer</Label>
              <p className="text-sm text-muted-foreground">Nyheder og nye features</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle>Privatliv & data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Dine data</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Vi tager dit privatliv seriøst. Dine data er krypteret og deles aldrig uden din tilladelse.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Download mine data</Button>
              <Button variant="outline" size="sm">Slet min konto</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
