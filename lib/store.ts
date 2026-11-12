export interface Member {
  id: string;
  fullName: string;
  jerseyName: string;
  rollNumber: string;
  size: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL' | '2XL' | '3XL';
  photoUrl: string;
  joinedAt: string;
  status: 'confirmed' | 'pending';
}

export interface BatchData {
  id: string;
  collegeName: string;
  courseSection: string;
  graduatingYear: number;
  durationYears: number;
  startYear: number;
  email: string;
  phone: string;
  pack: 'basic' | 'salina' | 'top';
  packPrice: number;
  isExpress: boolean;
  collageShape: 'honeycomb' | 'square' | 'chain';
  backTemplate: 'jersey' | 'varsity' | 'minimal';
  rollDigits: number;
  includeLogo: boolean;
  expectedMembers: number;
  createdAt: string;
  status: 'collecting' | 'reviewing' | 'printing' | 'shipped';
  members: Member[];
}

export const SAMPLE_AVATARS: string[] = [];

const STORAGE_KEY = 'teepresso_batches_v1';

export function getStoredBatches(): BatchData[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getBatchById(id: string): BatchData | null {
  const batches = getStoredBatches();
  const found = batches.find((b) => b.id === id);
  return found || null;
}

export function saveBatch(batch: BatchData): void {
  if (typeof window === 'undefined') return;
  const batches = getStoredBatches();
  const index = batches.findIndex((b) => b.id === batch.id);
  if (index >= 0) {
    batches[index] = batch;
  } else {
    batches.unshift(batch);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
}

export function addMemberToBatch(batchId: string, member: Omit<Member, 'id' | 'joinedAt'>): Member {
  const batch = getBatchById(batchId);
  const newMember: Member = {
    ...member,
    id: 'm_' + Math.random().toString(36).substring(2, 9),
    joinedAt: 'Just now',
  };
  if (batch) {
    batch.members.unshift(newMember);
    saveBatch(batch);
  }
  return newMember;
}
