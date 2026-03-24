export type Region = 'kr' | 'us' | 'cn' | 'jp'
export type UserRole = 'client' | 'marketer'
export type RequestStatus = 'open' | 'in_progress' | 'completed' | 'closed'
export type ProposalStatus = 'pending' | 'accepted' | 'rejected'
export type Specialty = 'sns' | 'blog' | 'place' | 'ads'

export interface User {
  id: string
  email: string
  role: UserRole
  name: string
  phone?: string
  avatar_url?: string
  region: Region
  created_at: string
}

export interface MarketerProfile {
  id: string
  user_id: string
  specialties: Specialty[]
  experience_years?: number
  bio?: string
  price_range_min?: number
  price_range_max?: number
  rating_avg: number
  review_count: number
  is_verified: boolean
  region: Region
  created_at: string
}

export interface Portfolio {
  id: string
  marketer_id: string
  title: string
  description?: string
  category: string
  image_urls?: string[]
  result_summary?: string
  client_industry?: string
  created_at: string
}

export interface MarketingRequest {
  id: string
  client_id: string
  title: string
  industry: string
  marketing_type: string
  budget_min?: number
  budget_max?: number
  description: string
  status: RequestStatus
  proposal_count: number
  region: Region
  created_at: string
  expires_at?: string
}

export interface Proposal {
  id: string
  request_id: string
  marketer_id: string
  price: number
  duration_days?: number
  content: string
  portfolio_ids?: string[]
  status: ProposalStatus
  created_at: string
}

export interface Review {
  id: string
  proposal_id: string
  client_id: string
  marketer_id: string
  rating: number
  content: string
  created_at: string
}

export interface EventLog {
  id: string
  user_id?: string
  event_name: string
  event_data?: Record<string, unknown>
  created_at: string
}

// Joined types (with relations)
export interface MarketerProfileWithUser extends MarketerProfile {
  users: Pick<User, 'id' | 'name' | 'avatar_url' | 'phone'>
}

export interface ProposalWithMarketer extends Proposal {
  marketer_profiles: MarketerProfileWithUser & {
    portfolios: Portfolio[]
    reviews: Review[]
  }
}

export interface RequestWithProposals extends MarketingRequest {
  proposals: ProposalWithMarketer[]
}
