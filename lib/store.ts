export interface Member {
  id: string;
  fullName: string;
  jerseyName: string;
  rollNumber: string;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
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

// Sample avatars for instant realistic preview
export const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
];

const DEFAULT_BATCH: BatchData = {
  id: 'b938021f-a057-46d9-9f27-5a1c9a9bafea',
  collegeName: 'A K P S GOVT JR College - O4380, West Godavari',
  courseSection: 'ECE-B',
  graduatingYear: 2027,
  durationYears: 4,
  startYear: 2023,
  email: 'organizer@akps.edu.in',
  phone: '+91 98765 43210',
  pack: 'salina',
  packPrice: 150,
  isExpress: false,
  collageShape: 'square',
  backTemplate: 'jersey',
  rollDigits: 3,
  includeLogo: true,
  expectedMembers: 36,
  createdAt: new Date().toISOString(),
  status: 'collecting',
  members: [
    {
      id: 'm1',
      fullName: 'Neha Sharma',
      jerseyName: 'NEHA',
      rollNumber: '021',
      size: 'M',
      photoUrl: SAMPLE_AVATARS[0],
      joinedAt: '2 hours ago',
      status: 'confirmed',
    },
    {
      id: 'm2',
      fullName: 'Rahul Verma',
      jerseyName: 'RAHUL',
      rollNumber: '045',
      size: 'L',
      photoUrl: SAMPLE_AVATARS[1],
      joinedAt: '3 hours ago',
      status: 'confirmed',
    },
    {
      id: 'm3',
      fullName: 'Ananya Iyer',
      jerseyName: 'ANANYA',
      rollNumber: '012',
      size: 'S',
      photoUrl: SAMPLE_AVATARS[2],
      joinedAt: '4 hours ago',
      status: 'confirmed',
    },
    {
      id: 'm4',
      fullName: 'Karthik Raja',
      jerseyName: 'KARTHIK',
      rollNumber: '088',
      size: 'XL',
      photoUrl: SAMPLE_AVATARS[3],
      joinedAt: '5 hours ago',
      status: 'confirmed',
    },
    {
      id: 'm5',
      fullName: 'Pooja Reddy',
      jerseyName: 'POOJA',
      rollNumber: '034',
      size: 'M',
      photoUrl: SAMPLE_AVATARS[4],
      joinedAt: '6 hours ago',
      status: 'confirmed',
    },
    {
      id: 'm6',
      fullName: 'Aditya Sen',
      jerseyName: 'ADITYA',
      rollNumber: '076',
      size: 'L',
      photoUrl: SAMPLE_AVATARS[5],
      joinedAt: '1 day ago',
      status: 'confirmed',
    },
    {
      id: 'm7',
      fullName: 'Divya Nair',
      jerseyName: 'DIVYA',
      rollNumber: '019',
      size: 'S',
      photoUrl: SAMPLE_AVATARS[6],
      joinedAt: '1 day ago',
      status: 'confirmed',
    },
    {
      id: 'm8',
      fullName: 'Siddharth Patel',
      jerseyName: 'SID',
      rollNumber: '052',
      size: 'M',
      photoUrl: SAMPLE_AVATARS[7],
      joinedAt: '2 days ago',
      status: 'confirmed',
    },
  ],
};

const STORAGE_KEY = 'teepresso_batches_v1';

export function getStoredBatches(): BatchData[] {
  if (typeof window === 'undefined') {
    return [DEFAULT_BATCH];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([DEFAULT_BATCH]));
      return [DEFAULT_BATCH];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEFAULT_BATCH];
  } catch {
    return [DEFAULT_BATCH];
  }
}

export function getBatchById(id: string): BatchData | null {
  const batches = getStoredBatches();
  const found = batches.find((b) => b.id === id);
  if (found) return found;
  // If not found, return default batch updated with id for demo stability
  return {
    ...DEFAULT_BATCH,
    id,
  };
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
  const batch = getBatchById(batchId) || { ...DEFAULT_BATCH, id: batchId };
  const newMember: Member = {
    ...member,
    id: 'm_' + Math.random().toString(36).substring(2, 9),
    joinedAt: 'Just now',
  };
  batch.members.unshift(newMember);
  saveBatch(batch);
  return newMember;
}
