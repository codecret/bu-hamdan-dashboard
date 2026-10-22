export interface HomeBannerInput {
  titleAr: string;
  titleEn: string | null;
  bodyAr: string | null;
  bodyEn: string | null;
  imageUrl: string | null;
  partnerName: string | null;
  buttonAr: string | null;
  buttonEn: string | null;
  actionType: 'none' | 'post' | 'search' | 'directory' | 'listing' | 'showroom' | 'external';
  actionValue: string | null;
  displayOrder: number;
  durationSeconds: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export interface HomeBanner extends HomeBannerInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}
