
import { create } from 'zustand';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
  verified: boolean;
  helpful: number;
}

interface ReviewState {
  reviews: Review[];
  loading: boolean;
  error: string | null;
}

interface ReviewActions {
  getReviewsByProduct: (productId: string) => Review[];
  addReview: (review: Omit<Review, 'id' | 'date'>) => void;
  markHelpful: (reviewId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type ReviewStore = ReviewState & ReviewActions;

const mockReviews: Review[] = [
  {
    id: '1',
    productId: '1',
    userId: 'user1',
    userName: 'John D.',
    rating: 5,
    comment: 'Amazing headphones! Great sound quality and battery life.',
    date: new Date('2024-05-15'),
    verified: true,
    helpful: 23,
  },
  {
    id: '2',
    productId: '1',
    userId: 'user2',
    userName: 'Sarah M.',
    rating: 4,
    comment: 'Good value for money. Comfort could be better.',
    date: new Date('2024-05-20'),
    verified: true,
    helpful: 12,
  },
];

export const useReviewStore = create<ReviewStore>((set, get) => ({
  reviews: mockReviews,
  loading: false,
  error: null,

  getReviewsByProduct: (productId) => {
    const { reviews } = get();
    return reviews.filter(review => review.productId === productId);
  },

  addReview: (review) => {
    const newReview: Review = {
      ...review,
      id: Date.now().toString(),
      date: new Date(),
    };
    set((state) => ({ reviews: [...state.reviews, newReview] }));
  },

  markHelpful: (reviewId) => {
    set((state) => ({
      reviews: state.reviews.map(review =>
        review.id === reviewId
          ? { ...review, helpful: review.helpful + 1 }
          : review
      ),
    }));
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
