import type { Metadata } from "next";
import { FreelancersTabs } from "@/components/freelancers/freelancers-tabs";

export const metadata: Metadata = {
  title: "Freelancers — Kubo ERP",
};

export default function FreelancersPage() {
  return <FreelancersTabs />;
}
