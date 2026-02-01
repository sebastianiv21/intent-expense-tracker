"use client";

import { HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MindfulSavingsWidgetProps {
  milestone?: string;
  message?: string;
}

export function MindfulSavingsWidget({
  milestone = "Mindfulness Milestone",
  message = "You haven't spent on unnecessary subscriptions for 4 weeks. That's $120 extra for your \"Future Freedom\" fund.",
}: MindfulSavingsWidgetProps) {
  return (
    <div className="bg-[#1f1815] p-6 rounded-[32px] border border-[#2d2420] overflow-hidden relative">
      <div className="relative z-10">
        <HeartHandshake className="h-8 w-8 text-[#c97a5a] mb-4" />
        <h3 className="font-bold text-lg mb-2 text-[#f5f2ed]">{milestone}</h3>
        <p className="text-sm text-[#a89580] leading-relaxed mb-6">{message}</p>
        <Button className="px-6 py-2.5 rounded-full warm-gradient text-white text-sm font-semibold hover:opacity-90 transition-opacity border-0">
          Celebrate
        </Button>
      </div>
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#c97a5a]/5 rounded-full blur-2xl" />
    </div>
  );
}
