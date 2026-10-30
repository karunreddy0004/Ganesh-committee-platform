
const API_URL = "http://127.0.0.1:8000/api/v1";

export type Committee = {
  id: number;
  name: string;
  slug: string;
  location: string;
  festival_year: number;
  status: string;
  created_at: string;
};

export type CommitteeCreate = {
  name: string;
  location: string;
  festival_year: number;
};

export type CommitteeUpdate = {
  name?: string;
  location?: string;
  festival_year?: number;
  status?: string;
};

export type AuditLog = {
  id: number;
  committee_id: number;
  committee_name: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  actor: string;
  changed_at: string;
};

async function checkResponse(response: Response, fallback: string) {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || fallback);
  }
}

export async function getCommittees(): Promise<Committee[]> {
  const response = await fetch(`${API_URL}/committees`, {
    cache: "no-store",
  });
  await checkResponse(response, "Unable to load committees");
  return response.json();
}

export async function createCommittee(
  data: CommitteeCreate
): Promise<Committee> {
  const response = await fetch(`${API_URL}/committees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await checkResponse(response, "Unable to create committee");
  return response.json();
}

export async function updateCommittee(
  id: number,
  data: CommitteeUpdate
): Promise<Committee> {
  const response = await fetch(`${API_URL}/committees/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await checkResponse(response, "Unable to update committee");
  return response.json();
}

export async function deleteCommittee(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/committees/${id}`, {
    method: "DELETE",
  });
  await checkResponse(response, "Unable to delete committee");
}

export async function getCommitteeAudit(
  id: number
): Promise<AuditLog[]> {
  const response = await fetch(`${API_URL}/committees/${id}/audit`, {
    cache: "no-store",
  });
  await checkResponse(response, "Unable to load audit history");
  return response.json();
}


export type Donation = {
  id: number;
  committee_id: number;
  donor_name: string;
  amount: number | string;
  donation_date: string;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
};

export type DonationCreate = {
  committee_id: number;
  donor_name: string;
  amount: number;
  donation_date: string;
  payment_method: string;
  reference_number?: string | null;
  notes?: string | null;
};

export async function getDonations(
  committeeId?: number
): Promise<Donation[]> {
  const query = committeeId
    ? `?committee_id=${committeeId}`
    : "";

  const response = await fetch(`${API_URL}/donations${query}`, {
    cache: "no-store",
  });

  await checkResponse(response, "Unable to load donations");
  return response.json();
}

export async function createDonation(
  data: DonationCreate
): Promise<Donation> {
  const response = await fetch(`${API_URL}/donations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  await checkResponse(response, "Unable to register donation");
  return response.json();
}
