import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, Linkedin, Copy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface WaitlistFormProps {
  variant?: "hero" | "sticky";
}

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  queue_position: number;
  referral_code: string;
}

export function WaitlistForm({ variant = "hero" }: WaitlistFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [entryData, setEntryData] = useState<WaitlistEntry | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) return;

    setIsLoading(true);

    try {
      // Get referral code from URL if present
      const urlParams = new URLSearchParams(window.location.search);
      const referredBy = urlParams.get("ref");

      const { data, error } = await supabase.rpc("join_waitlist", {
        p_name: name.trim(),
        p_email: email.trim().toLowerCase(),
        p_referred_by: referredBy,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already on the list!",
            description: "This email is already registered for the waitlist.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        setEntryData(data[0] as WaitlistEntry);
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error("Error joining waitlist:", error);
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const referralLink = entryData
    ? `${window.location.origin}${window.location.pathname}?ref=${entryData.referral_code}`
    : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Link copied!",
      description: "Share it with your team to move up the queue.",
    });
  };

  const handleShareLinkedIn = () => {
    const text = encodeURIComponent(
      "I just joined the waitlist for Rackledger - finally a ledger that bridges physical hardware and financial data automatically. Check it out!"
    );
    const url = encodeURIComponent(referralLink);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`,
      "_blank"
    );
  };

  if (isSubmitted && entryData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-card border border-border rounded-2xl p-6 ${
          variant === "hero" ? "max-w-md mx-auto" : ""
        }`}
      >
        <div className="flex items-center justify-center w-12 h-12 bg-emerald-500/20 rounded-full mb-4 mx-auto">
          <Check className="w-6 h-6 text-emerald-500" />
        </div>
        <h3 className="text-xl font-bold text-foreground text-center mb-2">
          You're on the list, {entryData.name.split(" ")[0]}!
        </h3>
        <p className="text-muted-foreground text-center mb-4">
          You are currently{" "}
          <span className="text-accent font-semibold">
            #{entryData.queue_position}
          </span>{" "}
          in line.
        </p>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Move up the queue by sharing Rackledger with your team.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleShareLinkedIn}
            className="flex-1 bg-[#0A66C2] hover:bg-[#004182] text-white"
          >
            <Linkedin className="w-4 h-4 mr-2" />
            Share on LinkedIn
          </Button>
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="flex-1"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Referral Link
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={variant === "hero" ? "max-w-md mx-auto" : ""}
    >
      <div
        className={`flex ${
          variant === "sticky" ? "flex-row" : "flex-col"
        } gap-3`}
      >
        {variant === "hero" && (
          <Input
            type="text"
            placeholder="What should we call you?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bg-background border-border h-12 text-base focus:border-accent focus:ring-accent"
          />
        )}
        <div
          className={`flex ${
            variant === "sticky" ? "flex-row" : "flex-col sm:flex-row"
          } gap-3`}
        >
          {variant === "sticky" && (
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-background border-border h-10 focus:border-accent focus:ring-accent"
            />
          )}
          <Input
            type="email"
            placeholder="Enter your work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`bg-background border-border ${
              variant === "hero" ? "h-12 text-base" : "h-10"
            } focus:border-accent focus:ring-accent`}
          />
          <Button
            type="submit"
            disabled={isLoading}
            className={`bg-accent text-accent-foreground hover:bg-accent/90 group whitespace-nowrap ${
              variant === "hero" ? "h-12 px-6" : "h-10 px-4"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Joining...
              </span>
            ) : (
              <>
                Join the Waitlist
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </div>

      {variant === "hero" && (
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>
            Join <span className="text-foreground font-medium">400+</span> IT
            Managers and Controllers already in line.
          </span>
        </div>
      )}
    </form>
  );
}
