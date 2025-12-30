import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ArrowRight, 
  Clock, 
  Search, 
  Activity, 
  ChevronDown,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { getAnalyses, getResearchLogs, type ResearchLog } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function HistoryPage() {
  const [_, setLocation] = useLocation();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const { data: analyses, isLoading } = useQuery({
    queryKey: ["analyses"],
    queryFn: getAnalyses,
  });

  const { data: researchLogs } = useQuery({
    queryKey: ["researchLogs"],
    queryFn: getResearchLogs,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen gap-6 max-w-md mx-auto text-center p-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">No History Yet</h2>
            <p className="text-muted-foreground">
              Start by analyzing a watch to build your research history.
            </p>
          </div>
          <Button onClick={() => setLocation("/")} className="gap-2">
            <Search className="w-4 h-4" /> Search Watches
          </Button>
        </div>
      </Layout>
    );
  }

  // Group research logs by analysis
  const logsByAnalysis = researchLogs?.reduce((acc, log) => {
    if (!acc[log.analysisId]) acc[log.analysisId] = [];
    acc[log.analysisId].push(log);
    return acc;
  }, {} as Record<string, ResearchLog[]>) || {};

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Research History</h1>
            <p className="text-muted-foreground mt-1">
              {analyses.length} {analyses.length === 1 ? "analysis" : "analyses"} completed
            </p>
          </div>
          <Button onClick={() => setLocation("/")} variant="outline" className="gap-2">
            <Search className="w-4 h-4" /> New Search
          </Button>
        </div>
        
        <div className="grid gap-4">
          {analyses.map((analysis) => {
            const logs = logsByAnalysis[analysis.id] || [];
            const hasData = analysis.confidenceScore !== null;
            
            return (
              <Card key={analysis.id} className="border-border/50 overflow-hidden">
                <CardContent className="p-0">
                  <Link href={`/dashboard/${analysis.id}`}>
                    <div className="p-6 flex items-center justify-between hover:bg-accent/5 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          hasData ? "bg-green-500/10" : "bg-secondary"
                        )}>
                          {hasData ? (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                          ) : (
                            <Clock className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {analysis.brand} {analysis.model}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Ref. {analysis.reference} • {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {hasData ? (
                          <div className="text-right mr-2">
                            <div className="text-sm font-medium">
                              {analysis.marketPrice ? `$${analysis.marketPrice.toLocaleString()}` : "N/A"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Confidence: {analysis.confidenceScore}%
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-secondary/50">Pending</Badge>
                        )}
                        <ArrowRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                  
                  {/* Research Logs Section */}
                  {logs.length > 0 && (
                    <Collapsible 
                      open={expandedLog === analysis.id}
                      onOpenChange={(open) => setExpandedLog(open ? analysis.id : null)}
                    >
                      <CollapsibleTrigger asChild>
                        <button className="w-full px-6 py-3 border-t border-border/50 flex items-center justify-between text-sm text-muted-foreground hover:bg-secondary/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>Research Logs ({logs.length})</span>
                          </div>
                          <ChevronDown className={cn(
                            "w-4 h-4 transition-transform",
                            expandedLog === analysis.id && "rotate-180"
                          )} />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t border-border/50 bg-secondary/20">
                          {logs.map((log) => (
                            <div key={log.id} className="p-4 border-b border-border/30 last:border-0">
                              <div className="flex items-center gap-2 mb-3">
                                {log.status === "completed" ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                ) : log.status === "failed" ? (
                                  <AlertCircle className="w-4 h-4 text-red-500" />
                                ) : (
                                  <Activity className="w-4 h-4 text-primary animate-pulse" />
                                )}
                                <span className="font-medium text-sm capitalize">{log.status}</span>
                                <span className="text-xs text-muted-foreground">
                                  • {log.durationSeconds ? `${log.durationSeconds.toFixed(1)}s` : "In progress"}
                                  • {log.extractedCount} records extracted
                                </span>
                              </div>
                              
                              {/* Prompt */}
                              <div className="mb-3">
                                <div className="text-xs font-medium text-muted-foreground mb-1 uppercase">Prompt</div>
                                <ScrollArea className="h-32 bg-background rounded border border-border/50 p-3">
                                  <pre className="text-xs whitespace-pre-wrap font-mono">{log.prompt}</pre>
                                </ScrollArea>
                              </div>
                              
                              {/* Response */}
                              {log.rawResponse && (
                                <div>
                                  <div className="text-xs font-medium text-muted-foreground mb-1 uppercase">Response</div>
                                  <ScrollArea className="h-48 bg-background rounded border border-border/50 p-3">
                                    <pre className="text-xs whitespace-pre-wrap font-mono">{log.rawResponse}</pre>
                                  </ScrollArea>
                                </div>
                              )}
                              
                              {/* Error */}
                              {log.errorMessage && (
                                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded">
                                  <div className="text-xs font-medium text-red-500 mb-1">Error</div>
                                  <p className="text-sm text-red-400">{log.errorMessage}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
