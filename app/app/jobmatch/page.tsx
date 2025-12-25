'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlan } from '@/contexts/plan-context';
import { ProGate } from '@/components/pro-gate';
import { mockJobs, Job } from '@/lib/mock-data';
import { Briefcase, MapPin, Building2, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function JobMatchPage() {
  const { isProUser } = usePlan();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showProGate, setShowProGate] = useState(false);
  const [filters, setFilters] = useState({ remote: 'alle', senioritet: 'alle' });

  const jobsToShow = isProUser ? mockJobs : mockJobs.slice(0, 5);

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
  };

  const handleProFeature = () => {
    if (!isProUser) {
      setShowProGate(true);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Jobmatch</h1>
          <p className="text-muted-foreground">
            {isProUser ? 'Op til 12 personlige jobmatch' : 'Op til 5 jobmatch i Light planen'}
          </p>
        </div>
        {!isProUser && (
          <Button onClick={handleProFeature}>
            <Lock className="mr-2 h-4 w-4" />
            Lås op for flere
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Arbejdsform</label>
              <Select value={filters.remote} onValueChange={(v) => setFilters({...filters, remote: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">Onsite</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Senioritet</label>
              <Select value={filters.senioritet} onValueChange={(v) => setFilters({...filters, senioritet: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="medior">Medior</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Lokation</label>
              <Select defaultValue="alle">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle</SelectItem>
                  <SelectItem value="koebenhavn">København</SelectItem>
                  <SelectItem value="aarhus">Aarhus</SelectItem>
                  <SelectItem value="odense">Odense</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {jobsToShow.map((job) => (
          <Card key={job.id} className="hover:border-primary transition-colors cursor-pointer" onClick={() => handleJobClick(job)}>
            <CardHeader>
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-2">
                  <Badge variant="secondary" className="font-semibold">
                    {job.matchScore}% match
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {job.remote}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {job.senioritet}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-xl">{job.titel}</CardTitle>
              <CardDescription className="flex items-center gap-4 text-base">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {job.virksomhed}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.lokation}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Hvorfor passer det</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                  {job.hvorforPasser.slice(0, 2).map((reason, i) => (
                    <li key={i}>• {reason}</li>
                  ))}
                </ul>
              </div>

              {job.gaps.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">Gap at arbejde på</span>
                  </div>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                    {job.gaps.slice(0, 1).map((gap, i) => (
                      <li key={i}>• {gap}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button className="w-full" variant="outline">
                Se fuld analyse
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Job Detail Dialog */}
      <Dialog open={!!selectedJob} onOpenChange={() => setSelectedJob(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedJob && (
            <>
              <DialogHeader>
                <div className="flex gap-2 mb-3">
                  <Badge variant="secondary" className="font-semibold">
                    {selectedJob.matchScore}% match
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {selectedJob.remote}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {selectedJob.senioritet}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">{selectedJob.titel}</DialogTitle>
                <DialogDescription className="text-base">
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {selectedJob.virksomhed}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedJob.lokation}
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div>
                  <h3 className="font-semibold mb-2">Om jobbet</h3>
                  <p className="text-sm text-muted-foreground">{selectedJob.beskrivelse}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    Hvorfor passer det til dig
                  </h3>
                  <ul className="space-y-2">
                    {selectedJob.hvorforPasser.map((reason, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-primary">✓</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {selectedJob.gaps.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Udviklingsområder
                    </h3>
                    <ul className="space-y-2">
                      {selectedJob.gaps.map((gap, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <span className="text-orange-500">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Krav til stillingen</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.krav.map((krav, i) => (
                      <Badge key={i} variant="outline">{krav}</Badge>
                    ))}
                  </div>
                </div>

                {/* Pro Feature */}
                <div className="border border-primary/20 rounded-lg p-4 bg-primary/5">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Pro Feature: AI Ansøgning</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Få en skræddersyet ansøgning genereret baseret på din profil og jobbets krav
                      </p>
                      {isProUser ? (
                        <Button size="sm">Generér ansøgning</Button>
                      ) : (
                        <Button size="sm" onClick={handleProFeature}>
                          Opgrader til Pro
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1">Gem job</Button>
                  <Button className="flex-1" variant="outline">Del</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ProGate
        isOpen={showProGate}
        onClose={() => setShowProGate(false)}
        feature="Flere jobmatch og AI-genererede ansøgninger"
      />
    </div>
  );
}
