import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { Users, Trophy, TrendingUp, UserCheck, Search, Download, ArrowUpDown, Plus, Pencil, FileText, ChevronDown } from "lucide-react";
import AddParticipantModal from "./AddParticipantModal";
import EditReferralModal from "./EditReferralModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Contest {
  id: string;
  title: string;
  active: boolean;
}

interface Participant {
  id: string;
  email: string;
  referral_code: string;
  referral_count: number;
  joined_contest: boolean;
  created_at: string;
  referred_by_code: string | null;
  custom_data: Record<string, string>;
}

interface ContestField {
  id: string;
  label: string;
  field_type: string;
}

interface ParticipantsAnalyticsProps {
  businessId: string;
  contests: Contest[];
}

const ParticipantsAnalytics = ({ businessId, contests }: ParticipantsAnalyticsProps) => {
  const [selectedContestId, setSelectedContestId] = useState<string>("");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [fields, setFields] = useState<ContestField[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterJoined, setFilterJoined] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"created_at" | "referral_count">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

  // Set default contest when contests change
  useEffect(() => {
    if (contests.length > 0 && !selectedContestId) {
      setSelectedContestId(contests[0].id);
    }
  }, [contests, selectedContestId]);

  // Fetch participants and fields when contest changes
  useEffect(() => {
    if (selectedContestId) {
      fetchParticipants();
      fetchFields();
    }
  }, [selectedContestId]);

  const fetchFields = async () => {
    const { data, error } = await supabase
      .from("racklerush_contest_fields")
      .select("id, label, field_type")
      .eq("contest_id", selectedContestId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching fields:", error);
      return;
    }

    setFields(data || []);
  };

  const fetchParticipants = async () => {
    setLoading(true);
    
    // Fetch participants
    const { data: participantsData, error: participantsError } = await supabase
      .from("racklerush_participants")
      .select("*")
      .eq("contest_id", selectedContestId)
      .order("created_at", { ascending: false });

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
      setLoading(false);
      return;
    }

    // Fetch participant data for all participants
    const participantIds = participantsData?.map(p => p.id) || [];
    
    if (participantIds.length === 0) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    const { data: customData, error: customDataError } = await supabase
      .from("racklerush_participant_data")
      .select("participant_id, field_id, value")
      .in("participant_id", participantIds);

    if (customDataError) {
      console.error("Error fetching custom data:", customDataError);
    }

    // Map custom data to participants
    const participantsWithData: Participant[] = (participantsData || []).map(p => {
      const pData = (customData || []).filter(d => d.participant_id === p.id);
      const customDataMap: Record<string, string> = {};
      pData.forEach(d => {
        customDataMap[d.field_id] = d.value || "";
      });
      
      return {
        ...p,
        custom_data: customDataMap
      };
    });

    setParticipants(participantsWithData);
    setLoading(false);
  };

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalParticipants = participants.length;
    const joinedCount = participants.filter(p => p.joined_contest).length;
    const totalReferrals = participants.reduce((sum, p) => sum + p.referral_count, 0);
    const conversionRate = totalParticipants > 0 
      ? Math.round((joinedCount / totalParticipants) * 100) 
      : 0;
    const avgReferrals = joinedCount > 0 
      ? (totalReferrals / joinedCount).toFixed(1) 
      : "0";
    const topReferrer = participants.reduce((max, p) => 
      p.referral_count > (max?.referral_count || 0) ? p : max, 
      null as Participant | null
    );

    return {
      totalParticipants,
      joinedCount,
      totalReferrals,
      conversionRate,
      avgReferrals,
      topReferrer
    };
  }, [participants]);

  // Filtered and sorted participants
  const filteredParticipants = useMemo(() => {
    let result = [...participants];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.email.toLowerCase().includes(term) ||
        p.referral_code.toLowerCase().includes(term) ||
        Object.values(p.custom_data).some(v => v.toLowerCase().includes(term))
      );
    }

    // Filter by joined status
    if (filterJoined === "joined") {
      result = result.filter(p => p.joined_contest);
    } else if (filterJoined === "not_joined") {
      result = result.filter(p => !p.joined_contest);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "created_at") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortBy === "referral_count") {
        comparison = a.referral_count - b.referral_count;
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return result;
  }, [participants, searchTerm, filterJoined, sortBy, sortOrder]);

  const getExportData = () => {
    const headers = ["Email", "Referral Code", "Referrals", "Joined", "Referred By", "Signed Up", ...fields.map(f => f.label)];
    const rows = filteredParticipants.map(p => [
      p.email,
      p.referral_code,
      p.referral_count.toString(),
      p.joined_contest ? "Yes" : "No",
      p.referred_by_code || "",
      new Date(p.created_at).toLocaleDateString(),
      ...fields.map(f => p.custom_data[f.id] || "")
    ]);
    return { headers, rows };
  };

  const exportToCSV = () => {
    const { headers, rows } = getExportData();

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participants-${selectedContestId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const { headers, rows } = getExportData();
    const selectedContest = contests.find(c => c.id === selectedContestId);
    
    const doc = new jsPDF({ orientation: "landscape" });
    
    // Title
    doc.setFontSize(16);
    doc.text(`Participants - ${selectedContest?.title || "Contest"}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Exported on ${new Date().toLocaleDateString()}`, 14, 22);
    doc.text(`Total: ${filteredParticipants.length} participants`, 14, 28);
    
    // Table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [249, 115, 22], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 14, right: 14 },
    });
    
    doc.save(`participants-${selectedContestId}.pdf`);
  };

  const toggleSort = (column: "created_at" | "referral_count") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
    setSortOrder("desc");
    }
  };

  const handleEditReferral = (participant: Participant) => {
    setEditingParticipant(participant);
    setShowEditModal(true);
  };

  if (contests.length === 0) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No contests yet</h3>
          <p className="text-muted-foreground">
            Create a contest first to view participant data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contest Selector */}
      <div className="flex items-center gap-4">
        <div className="w-64">
          <Label className="text-sm text-muted-foreground mb-1 block">Select Contest</Label>
          <Select value={selectedContestId} onValueChange={setSelectedContestId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a contest" />
            </SelectTrigger>
            <SelectContent>
              {contests.map(contest => (
                <SelectItem key={contest.id} value={contest.id}>
                  {contest.title} {contest.active && <Badge variant="secondary" className="ml-2">Active</Badge>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchParticipants}
          disabled={loading}
        >
          Refresh
        </Button>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          disabled={!selectedContestId}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Participant
        </Button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalParticipants}</p>
                <p className="text-sm text-muted-foreground">Total Signups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.joinedCount}</p>
                <p className="text-sm text-muted-foreground">Joined Contest</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalReferrals}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.conversionRate}%</p>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Referrals per Participant</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{analytics.avgReferrals}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Top Referrer</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topReferrer ? (
              <div>
                <p className="text-lg font-bold truncate">{analytics.topReferrer.email}</p>
                <p className="text-sm text-muted-foreground">
                  {analytics.topReferrer.referral_count} referrals
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">No referrals yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-card/50">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Participants</CardTitle>
              <CardDescription>
                {filteredParticipants.length} of {participants.length} participants
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={filteredParticipants.length === 0}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, code, or custom data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterJoined} onValueChange={setFilterJoined}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Participants</SelectItem>
                <SelectItem value="joined">Joined Contest</SelectItem>
                <SelectItem value="not_joined">Not Joined</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No participants found
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>
                      <button 
                        onClick={() => toggleSort("referral_count")}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        Referrals
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Referred By</TableHead>
                    {fields.map(field => (
                      <TableHead key={field.id}>{field.label}</TableHead>
                    ))}
                    <TableHead>
                      <button 
                        onClick={() => toggleSort("created_at")}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        Signed Up
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">{participant.email}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {participant.referral_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={participant.referral_count > 0 ? "default" : "secondary"}>
                          {participant.referral_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {participant.joined_contest ? (
                          <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
                            Joined
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not Joined</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {participant.referred_by_code ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {participant.referred_by_code}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      {fields.map(field => (
                        <TableCell key={field.id}>
                          {participant.custom_data[field.id] || "-"}
                        </TableCell>
                      ))}
                      <TableCell className="text-muted-foreground">
                        {new Date(participant.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditReferral(participant)}
                          className="h-7 px-2"
                        >
                          <Pencil className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddParticipantModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        contestId={selectedContestId}
        onSuccess={() => {
          setShowAddModal(false);
          fetchParticipants();
        }}
      />

      <EditReferralModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        participant={editingParticipant}
        onSuccess={() => {
          setShowEditModal(false);
          setEditingParticipant(null);
          fetchParticipants();
        }}
      />
    </div>
  );
};

export default ParticipantsAnalytics;
