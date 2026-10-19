"use client";

import React from "react";
import { Modal } from "@/components/Modal";
import { DailyActivityView, DailyActivityViewProps } from "@/components/DailyActivityView";

interface DailyActivityModalProps extends DailyActivityViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyActivityModal({
  isOpen,
  onClose,
  ...rest
}: DailyActivityModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Kunlik hisobot va amallar jurnali"
      description="Tanlangan kundagi barcha xaridlar, sotuvlar, to‘lovlar va qarz harakatlari xronologiyasi."
      maxWidth="max-w-4xl"
    >
      <DailyActivityView {...rest} />
    </Modal>
  );
}
