'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOnboarding } from '@/contexts/onboarding-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Upload,
  CheckCircle2,
  Plus,
  X,
} from 'lucide-react';

export default function CVPage() {
  const { data: onboardingData } = useOnboarding();
  const [fileName, setFileName] = useState(onboardingData.cvUploaded ? 'mit_cv.pdf' : '');
  const [kompetencer, setKompetencer] = useState(onboardingData.kompetencer);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mit CV</h1>
        <p className="text-muted-foreground">
          Upload og administrer dit CV og kompetencer
        </p>
      </div>

      <Tabs defaultValue="cv" className="space-y-4">
        <TabsList>
          <TabsTrigger value="cv">CV Upload</TabsTrigger>
          <TabsTrigger value="kompetencer">Kompetencer</TabsTrigger>
        </TabsList>

        <TabsContent value="cv" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dit CV
              </CardTitle>
              <CardDescription>
                Upload dit opdaterede CV for at få de bedste anbefalinger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fileName ? (
                <div className="border rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="h-8 w-8 text-primary shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium mb-1">CV uploadet</p>
                      <p className="text-sm text-muted-foreground">{fileName}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Sidst opdateret: I dag
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Label htmlFor="cv-reupload" className="cursor-pointer">
                      <Button type="button" variant="outline" asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload nyt CV
                        </span>
                      </Button>
                      <Input
                        id="cv-reupload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                      />
                    </Label>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="font-medium mb-2">Upload dit CV</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    PDF, DOC, DOCX (maks 5MB)
                  </p>
                  <Label htmlFor="cv-upload" className="cursor-pointer">
                    <Button type="button" asChild>
                      <span>Vælg fil</span>
                    </Button>
                    <Input
                      id="cv-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileUpload}
                    />
                  </Label>
                </div>
              )}

              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium mb-2">💡 Tips til dit CV:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Inkludér konkrete resultater og metrics</li>
                  <li>• Beskriv dine ansvarsområder tydeligt</li>
                  <li>• Nævn alle relevante teknologier og værktøjer</li>
                  <li>• Hold det opdateret med nyeste erfaring</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kompetencer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dine kompetencer</CardTitle>
              <CardDescription>
                Administrer og opdater dine kompetencer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {kompetencer.length > 0 ? (
                <div className="space-y-3">
                  {kompetencer.map((komp) => (
                    <div key={komp.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{komp.navn}</span>
                          <Badge variant="outline" className="text-xs">{komp.kategori}</Badge>
                          {komp.interesse && (
                            <span className="text-xs">❤️</span>
                          )}
                        </div>
                        {komp.niveau && (
                          <p className="text-sm text-muted-foreground capitalize">{komp.niveau}</p>
                        )}
                      </div>
                      <Select defaultValue={komp.niveau || 'erfaren'}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="begynder">Begynder</SelectItem>
                          <SelectItem value="erfaren">Erfaren</SelectItem>
                          <SelectItem value="ekspert">Ekspert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Ingen kompetencer endnu</p>
                  <p className="text-sm mt-1">Upload dit CV for at få identificeret dine kompetencer</p>
                </div>
              )}

              <Button variant="outline" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Tilføj kompetence
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
